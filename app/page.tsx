import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div>
      <Button asChild>
        <Link href={"/sign-in"} >Sign up with Google</Link>
      </Button>
    </div>
  );
}
