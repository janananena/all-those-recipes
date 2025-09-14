import {Button, Container, Nav, Navbar, NavDropdown} from 'react-bootstrap';
import {Link, useLocation} from 'react-router-dom';
import ThemeToggle from '../components/ThemeToggle.tsx';
import {useContext, useEffect, useState} from 'react';
import {useAuth} from "../context/AuthContext.tsx";
import ChangePasswordModal from "../modal/ChangePasswordModal.tsx";
import AddUserModal from "../modal/AddUserModal.tsx";
import {useUsersContext} from "../context/UsersContext.tsx";
import {useTranslation} from "react-i18next";
import AddEditRecipeModal from "../modal/AddEditRecipeModal.tsx";
import {RecipeContext} from "../context/RecipeContext.tsx";
import AddTagModal from "../modal/AddTagModal.tsx";
import AddEditBookModal from "../modal/AddEditBookModal.tsx";
import {BooksContext} from "../context/BooksContext.tsx";

export default function AppNavbar() {
    const location = useLocation();
    const isRecipes = location.pathname.startsWith('/recipes');
    const isTags = location.pathname.startsWith('/tags');
    const isUsers = location.pathname.startsWith('/users');
    const isBooks = location.pathname.startsWith('/books');

    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [showChangePw, setShowChangePw] = useState(false);
    const [showAddTag, setShowAddTag] = useState(false);
    const [showAddUser, setShowAddUser] = useState(false);
    const [showAddRecipe, setShowAddRecipe] = useState(false);
    const [showAddBook, setShowAddBook] = useState(false);
    const [expanded, setExpanded] = useState(false); // NEW

    const {addNewRecipe, updateRecipe, addNewTag} = useContext(RecipeContext);
    const {addNewBook, updateBook} = useContext(BooksContext);
    const {user, logout} = useAuth();
    const {addUser} = useUsersContext();
    const {i18n, t} = useTranslation();

    useEffect(() => {
        const current = document.documentElement.getAttribute('data-bs-theme') as 'light' | 'dark';
        if (current) setTheme(current);

        const observer = new MutationObserver(() => {
            const updated = document.documentElement.getAttribute('data-bs-theme') as 'light' | 'dark';
            setTheme(updated);
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-bs-theme'],
        });

        return () => observer.disconnect();
    }, []);

    const closeMenu = () => setExpanded(false);

    return (
        <Navbar bg={theme} variant={theme} expand="lg" expanded={expanded} onToggle={setExpanded} className="mb-3">
            <Container>
                <Navbar.Brand as={Link} to="/" onClick={closeMenu} className="text-muted">{t("appName")}</Navbar.Brand>
                <Navbar.Toggle aria-controls="main-navbar"/>
                <Navbar.Collapse id="main-navbar">
                    <Nav className="me-auto d-flex flex-column flex-lg-row align-items-lg-center gap-2">
                        <Nav.Link as={Link} to="/recipes" onClick={closeMenu}>
                            {t("nav.recipes")}
                        </Nav.Link>
                        <Nav.Link as={Link} to="/tags" onClick={closeMenu}>
                            {t("nav.tags")}
                        </Nav.Link>
                        <Nav.Link as={Link} to="/users" onClick={closeMenu}>
                            {t("nav.users")}
                        </Nav.Link>
                        <Nav.Link as={Link} to="/favorites" onClick={closeMenu}>
                            {t("nav.favorites")}
                        </Nav.Link>
                         <Nav.Link as={Link} to="/books" onClick={closeMenu}>
                            {t("nav.books")}
                        </Nav.Link>

                        {isRecipes && (
                            <Button variant="outline-secondary" size="sm" onClick={() => {
                                setShowAddRecipe(true);
                                closeMenu();
                            }}>
                                {t("nav.addRecipe")}
                            </Button>
                        )}
                        {isTags && (
                            <Button variant="outline-secondary" size="sm" onClick={() => {
                                setShowAddTag(true);
                                closeMenu();
                            }}>
                                {t("nav.addTag")}
                            </Button>
                        )}
                        {isUsers && (
                            <Button variant="outline-secondary" size="sm" onClick={() => {
                                setShowAddUser(true);
                                closeMenu();
                            }}>
                                {t("nav.addUser")}
                            </Button>
                        )}
                        {isBooks && (
                            <Button variant="outline-secondary" size="sm" onClick={() => {
                                setShowAddBook(true);
                                closeMenu();
                            }}>
                                {t("nav.addBook")}
                            </Button>
                        )}
                    </Nav>

                    <div className="d-flex flex-column flex-lg-row align-items-start align-items-lg-center gap-2 mt-3 mt-lg-0">
                        {user && (
                            <Nav>
                                <NavDropdown
                                    title={
                                        <span><i className="bi bi-person-circle me-1"></i>{user}</span>
                                    }
                                    align="end"
                                    onClick={(e) => e.stopPropagation()} // Prevent dropdown click from toggling navbar
                                >
                                    <NavDropdown.Item onClick={() => {
                                        setShowChangePw(true);
                                        closeMenu();
                                    }}>
                                        <i className="bi bi-key me-2"/> {t("nav.changePassword")}
                                    </NavDropdown.Item>
                                    <NavDropdown.Divider/>
                                    <NavDropdown.Item onClick={() => {
                                        logout();
                                        closeMenu();
                                    }}>
                                        <i className="bi bi-box-arrow-right me-2"/>{t("nav.logout")}
                                    </NavDropdown.Item>
                                </NavDropdown>
                            </Nav>
                        )}
                        <Button
                            variant="outline-secondary"
                            size="sm"
                            style={{height: '38px'}}
                            className="d-flex align-items-center justify-content-center"
                            onClick={() => {
                                i18n.changeLanguage(i18n.language === 'en' ? 'de' : 'en');
                                closeMenu();
                            }}
                        >
                            <span className={`flag-icon flag-icon-${i18n.language === 'en' ? 'gb' : 'de'}`}></span>
                        </Button>
                        <ThemeToggle/>
                    </div>
                </Navbar.Collapse>
            </Container>

            <AddEditRecipeModal show={showAddRecipe} onClose={() => setShowAddRecipe(false)} addRecipe={addNewRecipe} updateRecipe={updateRecipe} mode="add"/>
            <AddTagModal show={showAddTag} closeModal={() => setShowAddTag(false)} onAdded={addNewTag}/>
            <ChangePasswordModal show={showChangePw} onClose={() => setShowChangePw(false)}/>
            <AddUserModal show={showAddUser} onClose={() => setShowAddUser(false)} onSubmit={addUser}/>
            <AddEditBookModal show={showAddBook} closeModal={() => setShowAddBook(false)} addBook={addNewBook} updateBook={updateBook} mode="add"/>
        </Navbar>
    );
}
