import { getCollection } from 'astro:content';
export async function getStaticPaths() {
  return (await getCollection('publications')).map(publication => ({ params: { id: publication.id }, props: { bibtex: publication.data.bibtex } }));
}
export function GET({ props }: { props: { bibtex: string } }) {
  return new Response(`${props.bibtex.trim()}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
