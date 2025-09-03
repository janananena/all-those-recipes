import {Container} from 'react-bootstrap';
import {Outlet} from 'react-router-dom';
import AppNavbar from './AppNavbar';

export default function AppLayout() {

    return (
        <>
            <AppNavbar/>
            <Container className="my-4">
                <Outlet/>
            </Container>
        </>
    );
}
