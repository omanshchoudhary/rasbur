import { getGoogleLoginUrl, getGithubLoginUrl } from "@/services/auth.js";

export default function LoginPage() {
    const handleLogin = (provider: "google" | "github") => {
        if (provider === "google") {
            window.location.href = getGoogleLoginUrl();
        } else {
            window.location.href = getGithubLoginUrl();
        }
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative overflow-hidden">
            {/* Background Aesthetic Glows */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-blue/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-teal/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <div className="w-full max-w-md bg-surface-900/60 border border-white/5 backdrop-blur-xl rounded-panel p-8 shadow-panel relative z-10 text-center">
                
                {/* Brand Logo & Header */}
                <div className="mb-8">
                    <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-accent-blue to-accent-teal text-surface-950 text-3xl font-black shadow-lg mb-4 select-none">
                        R
                    </span>
                    <h1 className="text-3xl font-extrabold tracking-tight text-text-50">Welcome to Rasbur</h1>
                    <p className="text-text-300 text-sm mt-2">
                        Sign in to access your decoder pipeline, history, and developer tools.
                    </p>
                </div>

                <div className="h-[1px] bg-white/5 my-6" />

                {/* Login Strategy Buttons */}
                <div className="space-y-4">
                    <button
                        onClick={() => handleLogin("google")}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-white text-surface-950 font-bold rounded-xl shadow-md hover:bg-gray-100 hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 cursor-pointer"
                    >
                        {/* Google Icon SVG */}
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="#4285F4"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="#34A853"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                            />
                            <path
                                fill="#EA4335"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                            />
                        </svg>
                        Continue with Google
                    </button>

                    <button
                        onClick={() => handleLogin("github")}
                        className="w-full flex items-center justify-center gap-3 px-6 py-3.5 bg-surface-950 border border-white/10 hover:border-white/20 text-text-50 font-bold rounded-xl shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all duration-150 cursor-pointer"
                    >
                        {/* GitHub Icon SVG */}
                        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                        </svg>
                        Continue with GitHub
                    </button>
                </div>

                {/* Footer terms info */}
                <p className="text-xs text-text-300/40 mt-8 font-medium">
                    By signing in, you agree to our Terms of Service and Privacy Policy.
                </p>
            </div>
        </div>
    );
}