import { Toaster } from "@/components/ui/sonner.tsx";
import { AuthProvider } from "@/auth/AuthProvider";
import { AppRouter } from "./router/AppRouter";
import { ProjectProvider } from "@/project/ProjectProvider";

function App() {
    return (
        <AuthProvider>
            <ProjectProvider>
                <AppRouter />
            </ProjectProvider>
            <Toaster />
        </AuthProvider>
    );
}

export default App;
