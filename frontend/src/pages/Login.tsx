import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Container, Form, Button, Alert } from 'react-bootstrap';
import {useTranslation} from "react-i18next";

export default function Login() {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const {t} = useTranslation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await login(username, password);
            navigate('/');
        } catch (err) {
            setError(t("login.invalidCredentials"));
        }
    };

    return (
        <Container className="mt-5" style={{ maxWidth: 400 }}>
            <h2 className="text-center mb-4">{t("appName")}</h2>
            <Form onSubmit={handleSubmit}>
                <Form.Group controlId="username" className="mb-3">
                    <Form.Label>{t("login.username")}</Form.Label>
                    <Form.Control type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </Form.Group>

                <Form.Group controlId="password" className="mb-3">
                    <Form.Label>{t("login.password")}</Form.Label>
                    <Form.Control type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </Form.Group>

                {error && <Alert variant="danger">{error}</Alert>}

                <Button type="submit" className="w-100">
                    {t("login.submit")}
                </Button>
            </Form>
        </Container>
    );
}
