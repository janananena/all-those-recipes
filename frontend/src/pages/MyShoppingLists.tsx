import {useContext, useEffect, useState} from "react";
import {Container, Table, Form} from "react-bootstrap";
import {useTranslation} from "react-i18next";
import {useAuth} from "../context/AuthContext";
import {RecipeContext} from "../context/RecipeContext";
import {useShoppingLists} from "../context/ShoppingListsContext.tsx";
import type {ShoppingList} from "../types/ShoppingLists.ts"; // <-- API call for updating notes

export default function MyShoppingLists() {
    const {t} = useTranslation();
    const {user} = useAuth();
    const {recipes, reloadRecipes} = useContext(RecipeContext);
    const {shoppingLists, reloadShoppingLists, updateShoppingList} = useShoppingLists();

    const [sortKey, setSortKey] = useState<"date" | "file">("date");
    const [sortAsc, setSortAsc] = useState<boolean>(false);

    useEffect(() => {
        reloadRecipes();
        reloadShoppingLists();
    }, []);

    const myLists = shoppingLists.filter((l: ShoppingList) => l.username === user);

    const sortedLists = [...myLists].sort((a, b) => {
        if (sortKey === "date") {
            return sortAsc
                ? new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
                : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortKey === "file") {
            return sortAsc
                ? a.listFileUrl.localeCompare(b.listFileUrl)
                : b.listFileUrl.localeCompare(a.listFileUrl);
        }
        return 0;
    });

    const getRecipeNames = (ids: string[]) =>
        ids
            .map(id => recipes.find(r => r.id === id)?.name)
            .filter(Boolean) as string[];

    const handleNotesChange = async (list: ShoppingList, newNotes: string) => {
        await updateShoppingList(list.id, newNotes);
    };

    const handleRowClick = (fileUrl: string) => {
        window.open(fileUrl, "_blank");
    };

    const renderSortIndicator = (column: "date"|"file") => {
        if (sortKey !== column) {
            return <i className="bi bi-arrow-down-up text-muted"></i>;
        }
        return sortAsc ? (
            <i className="bi bi-caret-up-fill"></i>
        ) : (
            <i className="bi bi-caret-down-fill"></i>
        );
    };

    return (
        <Container className="py-4">
            <div className="d-flex justify-content-between align-items-center mb-3 text-muted">
                <h2>{t("nav.shopping")}</h2>
            </div>

            {myLists.length === 0 && <p>{t("shopping.noLists")}</p>}

            {myLists.length > 0 && (
                <Table striped hover bordered responsive>
                    <thead>
                    <tr>
                        <th
                            role="button"
                            onClick={() => {
                                setSortKey("date");
                                setSortAsc(sortKey === "date" ? !sortAsc : true);
                            }}
                        >
                            {t("shopping.date")}{" "}
                            {renderSortIndicator("date")}
                        </th>
                        <th>{t("shopping.recipes")}</th>
                        <th
                            role="button"
                            onClick={() => {
                                setSortKey("file");
                                setSortAsc(sortKey === "file" ? !sortAsc : true);
                            }}
                        >
                            {t("shopping.file")}{" "}
                            {renderSortIndicator("file")}
                        </th>
                        <th>{t("shopping.notes")}</th>
                    </tr>
                    </thead>
                    <tbody>
                    {sortedLists.map(list => {
                        const fileName = list.listFileUrl.split("/").pop();
                        const recipeNames = getRecipeNames(list.recipeIds);

                        return (
                            <tr
                                key={list.listFileUrl}
                                style={{cursor: "pointer"}}
                                onClick={() => handleRowClick(list.listFileUrl)}
                            >
                                <td>{new Date(list.createdAt).toISOString().slice(0, 10)}</td>
                                <td>
                                    {recipeNames.map((name, idx) => (
                                        <div key={idx}>{name}</div>
                                    ))}
                                </td>
                                <td>{fileName}</td>
                                <td
                                    onClick={e => e.stopPropagation()} // prevent row click
                                >
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        value={list.notes}
                                        onChange={e =>
                                            handleNotesChange(list, e.target.value)
                                        }
                                    />
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </Table>
            )}
        </Container>
    );
}
