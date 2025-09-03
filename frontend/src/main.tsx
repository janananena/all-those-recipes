import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';
import 'flag-icon-css/css/flag-icons.css';
import {RecipeProvider} from "./context/RecipeContext";
import {AuthProvider} from "./context/AuthContext.tsx";
import {UsersProvider} from "./context/UsersContext.tsx";
import './i18n';
import {FavoritesProvider} from "./context/FavoritesContext.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <AuthProvider>
            <UsersProvider>
                <FavoritesProvider>
                    <RecipeProvider>
                        <App/>
                    </RecipeProvider>
                </FavoritesProvider>
            </UsersProvider>
        </AuthProvider>
    </React.StrictMode>
);
