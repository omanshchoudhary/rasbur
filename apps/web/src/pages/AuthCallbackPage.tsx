import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallbackPage() {
    const navigate = useNavigate();

    useEffect(() => {
        // Get your tokens from the url
        const params = new URLSearchParams(window.location.search);

        const accessToken = params.get("accessToken");
        const refreshToken = params.get("refreshToken");

        if (!accessToken || !refreshToken) {
            navigate("/login");
            return;
        }

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        navigate("/decode");
    }, [navigate]);

    return <p>Signing you in...</p>;
}
