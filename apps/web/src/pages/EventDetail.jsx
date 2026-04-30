import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL;

export default function EventDetail() {
  const { id } = useParams();
  const [event, setEvent] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`${API_URL}/events/${id}`);
        const data = await res.json();
        setEvent(data);
      } catch (err) {
        console.error(err);
        setEvent(null);
      }
    }
    load();
  }, [id]);

  if (!event) {
    return <div style={{ padding: 40 }}>Event not found</div>;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>{event.name}</h1>
      <p>{event.description}</p>
      <p>{event.location}</p>
      <button>Buy Ticket</button>
    </div>
  );
}