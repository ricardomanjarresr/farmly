import { getActiveListings } from "@/lib/listings";
import { Feed } from "@/components/Feed";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const listings = await getActiveListings();
  return <Feed listings={listings} />;
}
