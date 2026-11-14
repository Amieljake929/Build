export default function PageTitle({ children }) {
  return (
    <h1 className="mb-9 text-[length:clamp(1.1rem,1rem_+_0.6vw,1.5rem)] font-light tracking-brand uppercase">
      {children}
    </h1>
  )
}