import { Toaster } from "@/components/ui/sonner.tsx";
import { AuthProvider } from "@/auth/AuthProvider";
import { AppRouter } from "./router/AppRouter";

function App() {
    return (
        <AuthProvider>
            <AppRouter />
            <Toaster />
        </AuthProvider>
    );
}

export default App;
