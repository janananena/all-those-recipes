import {Button, Container, Form, ListGroup, Table} from "react-bootstrap";
import {useUsersContext} from "../context/UsersContext.tsx";
import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {createUser} from "../api/users.ts";
import {useAuth} from "../context/AuthContext.tsx";

export default function AllUsers() {

    const {users, reloadUsers, removeUser, changeRoles} = useUsersContext();
    const {roles} = useAuth();
    const {t} = useTranslation();

    const [newUserInput, setNewUserInput] = useState("");
    const [newUserPwInput, setNewUserPwInput] = useState("");

    const isAdmin = roles.includes("admin");
    const isUsermanager = roles.includes("usermanager");

    useEffect(() => {
        reloadUsers().then();
    }, []);

    const handleAddUser = async () => {
        const trimmedUser = newUserInput.trim();
        if (!trimmedUser) return;
        const trimmedUserPw = newUserPwInput.trim();
        if (!trimmedUserPw) return;

        const newUser = {
            username: trimmedUser,
            password: trimmedUserPw,
        };

        try {
            await createUser(newUser);
            await reloadUsers();
            setNewUserInput("");
            setNewUserPwInput("");
        } catch (err) {
            console.error("Failed to add user", err);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAddUser();
        }
    };

    const handleSubmit = (e: { preventDefault: () => void; }) => {
        e.preventDefault();
        handleAddUser();
    };

    const toggleRole = async (username: string, role: string, checked: boolean) => {
        const oldRoles = users.find(u => u.username === username)?.roles ?? [];
        const newRoles = checked ? [...oldRoles, role] : [...oldRoles].filter(r => r !== role);
        console.log(`changing user roles user ${username} role ${role} checked ${checked} oldroles ${oldRoles} newroles ${newRoles}`);
        await changeRoles(username, newRoles);
        await reloadUsers();
    }

    if (!isUsermanager && !isAdmin) {
        return (
            <Container className="py-4">
                <div className="d-flex justify-content-between align-items-center mb-3 text-muted">
                    <h2>{t("users.allUsers")}</h2>
                </div>

                <ListGroup>
                    {users.map((u) => (
                        <ListGroup.Item
                            key={u.username}
                            className="d-flex justify-content-between align-items-center text-muted">
                        <span>
                            <i className="bi bi-person" style={{color: 'var(--my-blue)'}}></i> {u.username}
                        </span>
                        </ListGroup.Item>
                    ))}
                </ListGroup>
            </Container>
        );
    }

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3 text-muted">
                <h2>{t("users.allUsers")}</h2>
            </div>

            <Table striped hover responsive className="text-muted">
                <thead>
                <tr>
                    <th style={{width: '70%'}} className="text-start text-muted">{t("users.username")}</th>
                    <th style={{width: '10%'}} className="text-muted text-nowrap">{t("users.isUsermanager")}</th>
                    {isAdmin && <th style={{width: '10%'}} className="text-muted">{t("users.isAdmin")}</th>}
                    {isAdmin && <th style={{width: '10%'}}/>}
                </tr>
                </thead>
                <tbody>
                {users.map((u) => {
                    const userIsAdmin = u.roles.includes("admin");
                    const userIsManager = u.roles.includes("usermanager");
                    return (
                        <tr key={u.username}>
                            <td className="text-start text-muted">
                                <i className="bi bi-person" style={{color: 'var(--my-blue)'}}></i>{" "}
                                {u.username}
                            </td>
                            <td>
                                <Form.Check
                                    type="checkbox"
                                    checked={userIsManager}
                                    onChange={(e) => toggleRole(u.username, "usermanager", e.target.checked)}
                                />
                            </td>
                            {isAdmin && (
                                <td>
                                    <Form.Check
                                        type="checkbox"
                                        checked={userIsAdmin}
                                        onChange={(e) => toggleRole(u.username, "admin", e.target.checked)}
                                    />
                                </td>
                            )}
                            {isAdmin && (
                                <td className="text-end text-muted">
                                    <Button
                                        className="btn-outline-red"
                                        size="sm"
                                        onClick={() => removeUser(u.username)}
                                    >
                                        <i className="bi bi-trash"></i> {t("users.delete")}
                                    </Button>
                                </td>
                            )}
                        </tr>
                    );
                })}
                </tbody>
            </Table>

            <Form className="mt-4">
                <Form.Group className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
                    <Form.Label
                        className="mb-0 text-start text-sm-end text-nowrap text-muted"
                        htmlFor="new-tag-input"
                    >
                        {t("user.add")}
                    </Form.Label>
                    <Form.Control
                        id="new-user-input"
                        type="text"
                        placeholder={t("user.newUser")}
                        value={newUserInput}
                        onChange={(e) => setNewUserInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        style={{minWidth: "200px"}}
                    />
                    <Form.Control
                        id="new-user-pw-input"
                        type="text"
                        placeholder={t("user.newPass")}
                        value={newUserPwInput}
                        onChange={(e) => setNewUserPwInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        style={{minWidth: "200px"}}
                    />
                    <Button
                        variant="secondary"
                        key="add-user-button"
                        type="submit"
                        onClick={handleSubmit}
                    >
                        add
                    </Button>
                </Form.Group>
            </Form>
        </Container>
    );
}
