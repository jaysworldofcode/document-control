import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-foreground">
            Document Control
          </h1>
          <p className="text-lg text-muted-foreground">
            Tailwind CSS and shadcn/ui are now successfully installed!
          </p>
        </div>
        
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">
            Test Components
          </h2>
          <div className="space-y-3">
            <Button className="w-full">Default Button</Button>
            <Button variant="destructive" className="w-full">
              Destructive Button
            </Button>
            <Button variant="outline" className="w-full">
              Outline Button
            </Button>
            <Button variant="secondary" className="w-full">
              Secondary Button
            </Button>
            <Button variant="ghost" className="w-full">
              Ghost Button
            </Button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-card border rounded-lg">
          <h3 className="text-lg font-medium text-card-foreground mb-2">
            What's Installed:
          </h3>
          <ul className="text-left text-sm text-muted-foreground space-y-1">
            <li>✅ Tailwind CSS with custom configuration</li>
            <li>✅ shadcn/ui component library setup</li>
            <li>✅ CSS variables for theming</li>
            <li>✅ Button component example</li>
            <li>✅ Utility functions (cn)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
