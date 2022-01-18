import { writable } from "svelte/store";

export const connectedWallet = writable<string>("");
export const connectedContract = writable<any>();
