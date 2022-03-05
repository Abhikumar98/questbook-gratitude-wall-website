import { ethers } from "ethers";
import abi from "./abi.json";

export const contract = () => {
	const { ethereum } = window;
	if (ethereum) {
		const provider = new ethers.providers.Web3Provider(ethereum);
		const signer = provider.getSigner();
		const contractReader = new ethers.Contract(
			"0x4BA4CDFfDEbDC13c5A87bDCa0D195D07e89833f2",
			abi,
			signer
		);
		return contractReader;
	}

	return null;
};
