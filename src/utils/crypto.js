import { ethers } from "ethers";
import abi from "./abi.json";

export const contract = () => {
	const { ethereum } = window;
	if (ethereum) {
		const provider = new ethers.providers.Web3Provider(ethereum);
		const signer = provider.getSigner();
		const contractReader = new ethers.Contract(
			"0xc32905b656fbfAa6d10C2037aD031E2002a4dc5d",
			abi,
			signer
		);
		return contractReader;
	}

	return null;
};

export const listenEvents = () => {
	const { ethereum } = window;
	if (ethereum) {
		const provider = new ethers.providers.Web3Provider(ethereum);
		const contractReader = new ethers.Contract(
			"0xc32905b656fbfAa6d10C2037aD031E2002a4dc5d",
			abi,
			provider
		);
		return contractReader;
	}

	return null;
};
