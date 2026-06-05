import { Toaster } from "@/components/ui/sonner.tsx";
import { RuntimeProvider } from "@/context/RuntimeContext.tsx";
import { AppRouter } from "./router/AppRouter";

function App() {
    return (
        <RuntimeProvider>
            <AppRouter />
            <Toaster />
        </RuntimeProvider>
    );
}

export default App;