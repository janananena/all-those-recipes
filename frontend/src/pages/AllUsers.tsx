import {Button, Container, Form, ListGroup} from "react-bootstrap";
import {useUsersContext} from "../context/UsersContext.tsx";
import {useTranslation} from "react-i18next";
import {useEffect, useState} from "react";
import {createUser} from "../api/users.ts";

export default function AllUsers() {

    const {users, reloadUsers, removeUser} = useUsersContext();
    const {t} = useTranslation();

    const [newUserInput, setNewUserInput] = useState("");
    const [newUserPwInput, setNewUserPwInput] = useState("");

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
            console.error("Failed to add tag", err);
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

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3 text-muted">
                <h2>{t("users.allUsers")}</h2>
            </div>

            <ListGroup>
                {users.map((u) => (
                    <ListGroup.Item
                        key={u.username}
                        className="d-flex justify-content-between align-items-center text-muted"
                    >
                        <span>
                            <i className="bi bi-person" style={{color: 'var(--my-blue)'}}></i> {u.username}
                        </span>
                        <Button
                            className="btn-outline-red"
                            // variant="outline-secondary"
                            size="sm"
                            onClick={() => removeUser(u.username)}
                        >
                            <i className="bi bi-trash"></i> {t("users.delete")}
                        </Button>
                    </ListGroup.Item>
                ))}
            </ListGroup>
            {/* Inline Add Form */}
            <Form className="mt-4">
                <Form.Group className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2">
                    <Form.Label className="mb-0 text-start text-sm-end text-nowrap text-muted" htmlFor="new-tag-input">
                        {t("user.add")}
                    </Form.Label>
                    <Form.Control
                        id="new-user-input"
                        type="text"
                        placeholder={t("user.newUser")}
                        value={newUserInput}
                        onChange={(e) => setNewUserInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        style={{minWidth: '200px'}} // optional, to control input width
                    />
                    <Form.Control
                        id="new-user-pw-input"
                        type="text"
                        placeholder={t("user.newPass")}
                        value={newUserPwInput}
                        onChange={(e) => setNewUserPwInput(e.target.value)}
                        onKeyDown={handleKeyPress}
                        style={{minWidth: '200px'}} // optional, to control input width
                    />
                    <Button variant="secondary" key="add-user-button" type="submit" onClick={handleSubmit}>
                        add
                    </Button>
                </Form.Group>
            </Form>
        </Container>
    );
}
