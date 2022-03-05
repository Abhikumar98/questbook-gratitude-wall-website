import { formatEther, parseEther } from "ethers/lib/utils";
import { useEffect, useState } from "react";
import {
	checkIfWalletIsConnected,
	connectWallet,
	minimizeAddress,
} from "./utils";
import { contract } from "./utils/crypto";
import human from "human-time";
import toast, { Toaster } from "react-hot-toast";

function App() {
	const [loading, setLoading] = useState(false);
	const [wallet, setWallet] = useState("");
	const [reciever, setReciever] = useState("");
	const [amount, setAmount] = useState(0);
	const [message, setMessage] = useState("");

	const [gratitudes, setGratitudes] = useState([]);

	const handleConnectWallet = async () => {
		try {
			const connectedWallet = await connectWallet();
			console.log({ connectedWallet });
			setWallet(connectedWallet);
		} catch (error) {
			console.error(error);
			toast.error(error);
		}
	};

	const fetchConnectedWallet = async () => {
		try {
			const wallet = await checkIfWalletIsConnected();
			console.log({ wallet });
			setWallet(wallet);
		} catch (error) {
			console.error(error);
			toast.error(error);
		}
	};

	const fetchPreviousGratitudes = async () => {
		const response = await contract().getAllGratiude();
		const formattedGratitudes = response.map((gratitude) => ({
			from: gratitude.from,
			to: gratitude.to,
			amount: gratitude.amount.toString(),
			timestamp: gratitude.timestamp.toString() * 1000,
			message: gratitude.message,
		}));
		const sortGratitudes = formattedGratitudes.sort(
			(a, b) => Number(b.timestamp) - Number(a.timestamp)
		);
		setGratitudes(sortGratitudes);
	};

	const handleGratitudeSubmit = async () => {
		try {
			setLoading(true);
			const tx = await contract().addGratitude(reciever, message, {
				value: parseEther(amount),
			});
			setReciever("");
			setAmount(0);
			setMessage("");
			await tx.wait();
			toast.success(`Thanks for showing gratitude :)`);
		} catch (error) {
			console.error(error);
			toast.error(error.message ?? "Something went wrong");
		} finally {
			setLoading(false);
		}
	};

	const fetchGratitudes = async (from, to, message, timestamp, amount) => {
		console.log({ from, to, message, timestamp, amount });
		const newGratitude = {
			from: from,
			to: to,
			amount: amount.toString(),
			timestamp: timestamp.toString() * 1000,
			message: message,
		};
		console.log([newGratitude, ...gratitudes]);
		setGratitudes((prevState) => [newGratitude, ...prevState]);
	};

	const startListening = async () => {
		contract().on(
			"GratitudeEvent",
			(from, to, message, timestamp, amount) =>
				fetchGratitudes(from, to, message, timestamp, amount)
		);
	};

	const sendUserGratitude = (address) => {
		setReciever(address);
	};

	useEffect(() => {
		fetchConnectedWallet();
		fetchPreviousGratitudes();
	}, []);

	useEffect(() => {
		if (wallet) {
			startListening();
			fetchPreviousGratitudes();
		}
		return wallet && contract().off("GratitudeEvent", fetchGratitudes);
	}, [wallet]);

	return (
		<div className="h-screen w-screen p-8 flex flex-col">
			<div className="flex items-center justify-between mx-24 pb-8">
				<div className="uppercase font-bold">Gratitude wall</div>
				<div className="flex items-center">
					{!!wallet ? (
						<div className="p-2 border-2 rounded-md">
							{minimizeAddress(wallet)}
						</div>
					) : (
						<button
							type="button"
							onClick={handleConnectWallet}
							className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
						>
							Connect
						</button>
					)}
				</div>
			</div>
			{!!wallet ? (
				<div className=" flex items-center justify-center mx-24 h-4/5 my-8 space-x-8">
					<div className="rounded-md border-4 w-3/5 h-full overflow-auto p-4 space-y-4">
						{!gratitudes.length && (
							<div className="flex items-center justify-center h-full flex-col space-y-4">
								<div>No one shown any gratitude yet :(</div>
							</div>
						)}
						{gratitudes.map((gratitude) => (
							<div key={gratitude.timestamp}>
								<p className="text-xs mb-1">
									{human(new Date(gratitude.timestamp))}
								</p>
								<div className="w-3/4 rounded-md rounded-b-md border-gray-200 border-2 ">
									<div className="border-b-2 p-2 border-gray-200 bg-gray-100">
										<span
											className={`font-bold mr-1 cursor-pointer px-1 transition-all border border-gray-100 ease-in-out hover:text-white hover:bg-gray-400 rounded-md ${
												wallet &&
												wallet.toLowerCase() ===
													gratitude.from.toLowerCase()
													? ""
													: " cursor-pointer"
											}`}
											onClick={() =>
												sendUserGratitude(
													gratitude.from
												)
											}
										>
											{minimizeAddress(
												gratitude.from,
												wallet
											)}
										</span>
										sent{" "}
										<span className="mx-1 font-bold">
											{formatEther(gratitude.amount)} eth
										</span>
										to{" "}
										<span
											className={` font-bold mr-4 cursor-pointer px-1 transition-all border border-gray-100 ease-in-out hover:text-white hover:bg-gray-400 rounded-md ${
												wallet &&
												wallet.toLowerCase() ===
													gratitude.to.toLowerCase()
													? ""
													: " cursor-pointer"
											}`}
											onClick={() =>
												sendUserGratitude(gratitude.to)
											}
										>
											{minimizeAddress(
												gratitude.to,
												wallet
											)}
										</span>
									</div>
									<div className="p-2">
										{gratitude.message}
									</div>
								</div>
							</div>
						))}
					</div>
					<div className="rounded-md border-4 w-2/5 h-full p-8">
						<div className="flex flex-col space-y-8">
							<div className="text-2xl font-bold">
								Show Gratitude towards others :)
							</div>
							<div>
								<label
									htmlFor="receiver"
									className="block text-sm font-medium text-gray-700"
								>
									Send to
								</label>
								<div className="mt-1">
									<input
										value={reciever}
										onChange={(e) =>
											setReciever(e.target.value)
										}
										type="text"
										name="receiver"
										id="receiver"
										className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
										placeholder="0x123..."
									/>
								</div>
							</div>
							<div>
								<label
									htmlFor="number"
									className="block text-sm font-medium text-gray-700"
								>
									Amount
								</label>
								<div className="mt-1">
									<input
										value={amount}
										onChange={(e) =>
											setAmount(e.target.value)
										}
										type="number"
										name="number"
										id="number"
										className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
										placeholder="0.5"
									/>
								</div>
							</div>
							<div>
								<label
									htmlFor="about"
									className="block text-sm font-medium text-gray-700 sm:mt-px sm:pt-2"
								>
									Message
								</label>
								<div className="mt-1 sm:mt-0 sm:col-span-2">
									<textarea
										value={message}
										onChange={(e) =>
											setMessage(e.target.value)
										}
										id="about"
										name="about"
										rows={3}
										className="max-w-lg shadow-sm block w-full focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border border-gray-300 rounded-md"
										defaultValue={""}
									/>
								</div>
							</div>
							<button
								onClick={handleGratitudeSubmit}
								type="button"
								disabled={loading}
								className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 w-full text-center justify-center"
							>
								{loading ? (
									<svg
										class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
									>
										<circle
											class="opacity-25"
											cx="12"
											cy="12"
											r="10"
											stroke="currentColor"
											stroke-width="4"
										></circle>
										<path
											class="opacity-75"
											fill="currentColor"
											d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
										></path>
									</svg>
								) : (
									"Send"
								)}
							</button>
						</div>
					</div>
				</div>
			) : (
				<div className="w-full h-full flex flex-col space-y-8 items-center justify-center">
					<div>Please switch to rinkeby and connect your wallet</div>
					<button
						type="button"
						onClick={handleConnectWallet}
						className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
					>
						{loading ? (
							<svg
								class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
								xmlns="http://www.w3.org/2000/svg"
								fill="none"
								viewBox="0 0 24 24"
							>
								<circle
									class="opacity-25"
									cx="12"
									cy="12"
									r="10"
									stroke="currentColor"
									stroke-width="4"
								></circle>
								<path
									class="opacity-75"
									fill="currentColor"
									d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
								></path>
							</svg>
						) : (
							"Connect"
						)}
					</button>
				</div>
			)}
			<Toaster />
		</div>
	);
}

export default App;
