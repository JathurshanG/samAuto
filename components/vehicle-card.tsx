import Link from "next/link";
import Image from "next/image";
import { Car } from "lucide-react";
import { money, number, statusLabel } from "@/lib/format";
import type { Listing } from "@/types/domain";
export function VehicleCard({ item }: { item: Listing }) {
  const v = item.vehicles;
  const images =
    (v as typeof v & { vehicle_images?: { id: string; position: number }[] })
      .vehicle_images || [];
  const photo = [...images].sort((a, b) => a.position - b.position)[0];
  return (
    <article className="card">
      <Link href={`/vehicules/${item.slug}`}>
        <div className="vehicle-image">
          {photo ? (
            <Image
              src={`/api/images/${photo.id}`}
              alt={`${v.make} ${v.model}`}
              fill
              sizes="(max-width:540px) 100vw, (max-width:800px) 50vw, 33vw"
            />
          ) : (
            <Car size={48} aria-label="Photo non disponible" />
          )}
        </div>
        <div className="card-body">
          <span className="badge">{statusLabel[item.status]}</span>
          <h3>
            {v.make} {v.model}
          </h3>
          <p className="muted">{v.version}</p>
          <p>
            {v.year} · {number(v.mileage)} km
            <br />
            {v.fuel} · {v.transmission}
          </p>
          <div className="price">{money(item.price)}</div>
        </div>
      </Link>
    </article>
  );
}
