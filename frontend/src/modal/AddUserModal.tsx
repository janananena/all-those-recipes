import { useState } from "react";
import { Button, Form, InputGroup, Modal } from "react-bootstrap";
import {useTranslation} from "react-i18next";

interface Props {
    show: boolean;
    onClose: () => void;
    onSubmit: (username: string, password: string) => void;
}

export default function AddUserModal({ show, onClose, onSubmit }: Props) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const {t} = useTranslation();

    const handleSubmit = () => {
        if (username.trim() && password) {
            onSubmit(username.trim(), password);
            setUsername("");
            setPassword("");
            onClose();
        }
    };

    return (
        <Modal show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>{t("user.add")}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <form style={{display: 'none'}} autoComplete="on">
                    <input type="text" name="username"/>
                    <input type="password" name="password"/>
                </form>
                <Form autoComplete="off">
                    <InputGroup className="mb-3">
                        <InputGroup.Text>{t("user.newUser")}</InputGroup.Text>
                        <Form.Control
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            name="nuser-ux-1"
                            autoComplete="off"
                            readOnly
                            onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
                        />
                    </InputGroup>
                    <InputGroup>
                        <InputGroup.Text>{t("user.newPass")}</InputGroup.Text>
                        <Form.Control
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            name="new-password"
                            autoComplete="off"
                            readOnly
                            onFocus={(e) => e.currentTarget.removeAttribute('readOnly')}
                        />
                    </InputGroup>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose}>
                    {t("user.cancel")}
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                    {t("user.save")}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
