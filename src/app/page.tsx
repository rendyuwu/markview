import { HomeForm } from "./home-form";

export default function Home() {
  return (
    <div className="flex flex-1 items-start justify-center px-4 pt-16 pb-12">
      <div className="w-full max-w-2xl">
        <h1 className="font-display text-[3rem] sm:text-5xl font-medium text-pure-black text-center mb-2 leading-none">
          MarkView
        </h1>
        <p className="text-stone text-center mb-10">
          Paste markdown or import from a URL
        </p>
        <HomeForm />
      </div>
    </div>
  );
}
