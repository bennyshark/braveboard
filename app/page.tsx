import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-20 ">
      <h1 className="font-medium text-5xl">
        Welcome to BraveBoard! Please sign in.
      </h1>
      <Button asChild
      className="py-8 px-8 bg-amber-900">
        <Link className="text-xl" 
        href={"/sign-in"} >Sign up with Google</Link>
      </Button>
    </div>
  );
}
