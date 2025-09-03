import {useState} from "react";
import { Modal, Button, Form, Alert, Stack } from "react-bootstrap";
import { AxiosError } from "axios";
import {useAuth} from "../context/AuthContext.tsx";
import {useTranslation} from "react-i18next"; // adjust if your function lives elsewhere

interface Props {
    show: boolean;
    onClose: () => void;
}

export default function ChangePasswordModal({ show, onClose }: Props) {
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const {changePassword} = useAuth();
    const {t} = useTranslation();

    const handleSubmit = async () => {
        setLoading(true);
        setError("");
        try {
            await changePassword(oldPassword, newPassword);
            onClose();
            setOldPassword("");
            setNewPassword("");
        } catch (err) {
            if (err instanceof AxiosError && err.response?.data?.error) {
                setError(err.response.data.error);
            } else {
                setError("Unexpected error");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal show={show} onHide={onClose}>
            <Modal.Header closeButton>
                <Modal.Title>{t("nav.changePassword")}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Stack gap={3}>
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form.Group>
                        <Form.Label>{t("password.old")}</Form.Label>
                        <Form.Control
                            type="password"
                            value={oldPassword}
                            onChange={(e) => setOldPassword(e.target.value)}
                        />
                    </Form.Group>
                    <Form.Group>
                        <Form.Label>{t("password.new")}</Form.Label>
                        <Form.Control
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </Form.Group>
                </Stack>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onClose} disabled={loading}>
                    {t("password.cancel")}
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    {loading ? t("password.saving") : t("password.save")}
                </Button>
            </Modal.Footer>
        </Modal>
    );
}
