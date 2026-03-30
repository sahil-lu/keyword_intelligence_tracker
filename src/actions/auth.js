"use server";

import {
	fetchClientWithToken,
	fetchClientWithoutToken,
} from "@/services/fetch";
import { cookies } from "next/headers";

export const sendOTP = async (body) => {
	const resp = await fetchClientWithoutToken("/v3/auth/tc/send", {
		method: "POST",
		body,
	});

	return resp;
};

export const reSendOTP = async (body) => {
	const resp = await fetchClientWithoutToken("/v3/auth/tc/resend", {
		method: "POST",
		body,
	});

	return resp;
};

export const verifyOTP = async (body) => {
	const resp = await fetchClientWithoutToken("/v3/auth/tc/verify", {
		method: "POST",
		body,
	});

	if (resp.error) return resp;

	const token = resp.data?.token;

	if (token) {
		const cookieStore = await cookies();
		cookieStore.set(`${process.env.NEXT_PUBLIC_COOKIE_KEY}_access`, token);
	}

	return resp;
};

export const getProfile = async (fallbackToken) => {
	const resp = await fetchClientWithToken("/v3/tc/profile", {
		method: "GET",
		fallbackToken,
	});

	if (resp.error) logout();

	return resp;
};

export const setProfile = async (body) => {
	const resp = await fetchClientWithToken("/v3/tc/user", {
		method: "PUT",
		body,
	});

	return resp;
};

export const logout = async () => {
	const cookieStore = await cookies();
	cookieStore.delete(`${process.env.NEXT_PUBLIC_COOKIE_KEY}_access`);
};

export const searchCity = async (data) => {
	const query = new URLSearchParams(data).toString();
	const resp = await fetchClientWithToken(`/v3/user/cities?${query}`, {
		method: "GET",
	});

	return resp;
};
