import type { User } from "@/lib/store";

export function Avatar({ user, size }: { user: User; size: number }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.42) }}>
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- data URL from the user's upload, or the Google profile photo
        <img src={user.avatarUrl} alt="" referrerPolicy="no-referrer" />
      ) : (
        user.nickname.slice(0, 1)
      )}
    </div>
  );
}
