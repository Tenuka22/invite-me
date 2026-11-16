import { Loader as LoadingSpinner } from "@invite-me/ui/components/motion/loader";

export default function Loader() {
  return (
    <div className="flex h-full items-center justify-center pt-8">
      <LoadingSpinner variant="metaballs"/>
    </div>
  );
}
