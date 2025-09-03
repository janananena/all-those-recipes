import {
    createBrowserRouter,
    Navigate,
    RouterProvider,
} from 'react-router-dom';
import AppLayout from './layout/AppLayout';
import {AllRecipes} from './pages/AllRecipes';
import RecipeDetail from './pages/RecipeDetail';
import AllTags from './pages/AllTags';
import Login from './pages/Login';
import ProtectedRoute from './routes/ProtectedRoute';
import AllUsers from "./pages/AllUsers.tsx";
import './App.css';
import MyFavorites from "./pages/MyFavorites.tsx";

const router = createBrowserRouter([
    {
        path: '/login',
        element: <Login/>,
    },
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <AppLayout/>
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Navigate to="/recipes" replace/>,
            },
            {
                path: 'recipes',
                element: <AllRecipes/>,
            },
            {
                path: 'recipes/:id',
                element: <RecipeDetail/>,
            },
            {
                path: 'tags',
                element: <AllTags/>,
            },
            {
                path: 'users',
                element: <AllUsers/>,
            },
            {
                path: 'favorites',
                element: <MyFavorites/>
            }
        ],
    },
], {
    basename: "/all-recipes",
});

export default function App() {
    return <RouterProvider router={router}/>;
}
