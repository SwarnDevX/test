import { Nav } from '../../components/nav.js';

export default function PublicLayout({ children }: { readonly children: React.ReactNode }) {
  return (
    <>
      <Nav />
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </>
  );
}
