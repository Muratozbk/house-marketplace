import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

function NotFound() {
    const navigate = useNavigate()
    useEffect(() => {
        setTimeout(() => navigate('/'), 5000)
    }, [navigate])
    return (
        <div className="notFound">
            <h1>Page not found!</h1>
            <p>please wait for a few seconds for redirect...</p>
            <br />
        </div>
    );
}

export default NotFound;