import { notFound } from "next/navigation";
import Link from "next/link";
import { requireStaff } from "@/features/auth/session";
import { VehicleEditor, ListingActions } from "@/features/vehicles/editor";
import { PhotoManager } from "@/features/vehicles/photos";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { client, members } = await requireStaff();
  const { data: businesses } = await client
    .from("businesses")
    .select("id,name")
    .eq("kind", "SALES")
    .in(
      "id",
      members.map((m) => m.business_id),
    );
  if (id === "nouveau")
    return (
      <>
        <h1>Ajouter un véhicule</h1>
        <VehicleEditor businesses={businesses || []} />
      </>
    );
  const { data: l } = await client
    .from("vehicle_listings")
    .select("*,vehicles(*)")
    .eq("id", id)
    .in("business_id", members.map(m => m.business_id))
    .single();
  if (!l) notFound();
  const { data: privateData } = await client
    .from("vehicle_private")
    .select("*")
    .eq("vehicle_id", l.vehicle_id)
    .single();
  const { data: images } = await client
    .from("vehicle_images")
    .select("id,position")
    .eq("vehicle_id", l.vehicle_id)
    .order("position");
  return (
    <>
      <h1>
        {l.vehicles.make} {l.vehicles.model}
      </h1>
      <ListingActions id={id} status={l.status} />
      {["AVAILABLE", "RESERVED", "SOLD"].includes(l.status) && (
        <p>
          <Link href={`/vehicules/${l.slug}`}>Voir la fiche publique</Link>
        </p>
      )}
      <PhotoManager vehicleId={l.vehicle_id} images={images || []} />
      <VehicleEditor
        id={id}
        businesses={businesses || []}
        initial={{
          ...l.vehicles,
          ...privateData,
          ...l,
          equipment: l.vehicles.equipment.join("\n"),
        }}
      />
    </>
  );
}
