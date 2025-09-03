import axios from "axios";

const apiBaseUrl = `/api`;

export async function getUsers() {
    const res = await axios.get(`${apiBaseUrl}/users`);
    return res.data;
}

export async function createUser(user: { username: string; password: string }) {
    const res = await axios.post(`${apiBaseUrl}/createUser`, user);
    return res.data;
}

export async function deleteUser(username: string) {
    const res = await axios.delete(`${apiBaseUrl}/users/${username}`);
    return res.data;
}
