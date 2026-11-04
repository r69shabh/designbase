type AvatarComponent = (props: { initials: string }) => JSX.Element;

const Avatar: AvatarComponent = ({ initials }) => <span className="rounded-full bg-brand-50 px-2 text-xs">{initials}</span>;

// Carbon-style: the default export is cast to a public type.
export default Avatar as AvatarComponent;
