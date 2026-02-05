import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";
import BottomTab from "@/components/customer/BottomTab";

export default function CustomerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-14 pb-16 max-w-screen-sm mx-auto w-full">
        {children}
      </main>
      <Footer />
      <BottomTab />
    </div>
  );
}
