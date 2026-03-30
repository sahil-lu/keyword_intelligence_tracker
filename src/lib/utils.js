import { clsx } from "clsx";
import { toast } from "sonner";
import { twMerge } from "tailwind-merge";

// Type for getType function
export const cn = (...inputs) => twMerge(clsx(inputs));

export const getType = (val) =>
	Object.prototype.toString.call(val).slice(8, -1);

export const getPaddedValue = (val, size = 2) =>
	val?.toString().padStart(size, "0") ?? "0";

export const formatNumber = (num) =>
	Number(parseInt(num.toString())).toLocaleString("en-IN");

export const compressNumber = (number = 0, precision = 1) => {
	if (getType(number) !== "Number") return number.toString();

	const units = [
		{ value: 1e18, symbol: "E" },
		{ value: 1e15, symbol: "P" },
		{ value: 1e12, symbol: "T" },
		{ value: 1e9, symbol: "G" },
		{ value: 1e6, symbol: "M" },
		{ value: 1e3, symbol: "k" },
		{ value: 1, symbol: "" },
	];

	const match = units.find(({ value }) => number >= value);

	if (!match) return "0";

	const formatted = (number / match.value).toFixed(precision);
	return parseFloat(formatted).toString() + match.symbol;
};

export const formatAmount = (amount, decimal = 2) => {
	if (amount === 0) return "0";
	const number = Number(amount);
	return number.toLocaleString("en-IN", {
		style: "currency",
		currency: "INR",
		minimumFractionDigits: decimal,
		maximumFractionDigits: decimal,
	});
};

export const remove = (values, option, key = "_id") => {
	const optionKey = typeof option === "object" ? option[key] : option;
	return values.filter(
		(val) => (typeof val === "object" ? val[key] : val) !== optionKey
	);
};

export const addOrRemove = (values, option, key = "_id") => {
	const optionKey = typeof option === "object" ? option[key] : option;
	const valueKeys = values.map((val) =>
		typeof val === "object" ? val[key] : val
	);

	return valueKeys.includes(optionKey)
		? remove(values ?? [], option, key)
		: [...values, option];
};

export const extractUsername = (string) => {
	const regexMap = {
		facebook:
			/(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9._]+)\/?/i,
		instagram:
			/(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?/i,
		linkedin:
			/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9._-]+)\/?/i,
		twitter: /(?:https?:\/\/)?(?:www\.)?x\.com\/([a-zA-Z0-9._]+)\/?/i,
		github: /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9._-]+)\/?/i,
	};

	for (const platform in regexMap) {
		const match = string.match(regexMap[platform]);
		if (match) return match[1];
	}

	return string;
};

export const splitToChunks = (arr, parts = 2, minItemsPerChunk = 4) => {
	const extendedArr = Array.from(
		{ length: parts * minItemsPerChunk },
		(_, i) => arr[i % arr.length]
	);
	return Array.from({ length: parts }, (_, i) =>
		extendedArr.slice(i * minItemsPerChunk, (i + 1) * minItemsPerChunk)
	);
};

export const handleCopy = ({ text, setCopy = () => { }, callback = null }) => {
	try {
		setCopy(true);
		navigator.clipboard.writeText(text);
		toast.error("Copied to clipboard");
		if (getType(callback) === "Function") callback?.();
		setTimeout(() => {
			setCopy(false);
		}, 1000);
	} catch (e) {
		toast.error("Failed to copy to clipboard");
		setCopy(false);
		console.error(e);
	}
};

export const mask = ({ email, phone }) => {
	const value = email || phone;
	const type = email ? "email" : "phone";

	if (!value) return value;

	switch (type) {
		case "email": {
			const [name, domain] = value.split("@");
			const { length: len } = name;
			const maskedAddress = name[0] + "*".repeat(len - 2) + name[len - 1];
			return maskedAddress + "@" + domain;
		}
		case "phone": {
			const padStart = value.slice(0, -4).length;
			return "*".repeat(padStart) + value.slice(-4);
		}
		default:
			return value;
	}
};

export const parseMD = (md) => md.replaceAll(/\\n/g, "\n");

export const generateRandomString = (length) => {
	let result = "";
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const charactersLength = characters.length;
	for (let i = 0; i < length; i++) {
		result += characters.charAt(
			Math.floor(Math.random() * charactersLength)
		);
	}
	return result;
};

export const getNestedValue = (obj, keys) =>
	keys.reduce(
		(acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined),
		obj
	);
