import { createContext, useContext, useEffect, useState } from 'react';
import {createUser, deleteUser, getUsers} from "../api/users.ts";
import {useTranslation} from "react-i18next";

type UsersContextType = {
    users: {username: string}[];
    addUser: (username: string, password: string) => Promise<void>;
    removeUser: (username: string) => Promise<void>;
    reloadUsers: () => Promise<void>;
};

const UsersContext = createContext<UsersContextType>({
    users: [],
    addUser: async () => {},
    removeUser: async () => {},
    reloadUsers: () => new Promise<void>(()=>{}),
});

export const UsersProvider = ({ children }: { children: React.ReactNode }) => {
    const [users, setUsers] = useState<{ username: string, aiUser: boolean }[]>([]);
    const {t} = useTranslation();

    const reloadUsers = async () => {
        try {
            const res = await getUsers();
            setUsers(res);
        } catch (err) {
            console.error("Failed to load users", err);
        }
    };

    useEffect(() => {
        reloadUsers();
    }, []);

    const addUser = async (username: string, password: string) => {
        try {
            await createUser({ username, password });
            await reloadUsers();
        } catch (err) {
            console.error("Failed to create user", err);
        }
    };

    const removeUser = async (username: string) => {
        if (!window.confirm(t("users.deleteConfirmation", {user: username}))) return;
        try {
            await deleteUser(username);
            await reloadUsers();
        } catch (err) {
            console.error("Failed to delete user", err);
        }
    };

    return (
        <UsersContext.Provider value={{ users, reloadUsers, addUser, removeUser }}>
            {children}
        </UsersContext.Provider>
    );
};

export const useUsersContext = () => useContext(UsersContext);
