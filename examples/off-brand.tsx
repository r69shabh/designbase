// What an agent typically writes when it only sees a screenshot: generic SaaS defaults.
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50 p-10 font-sans">
      <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
      <h3 className="mt-5 text-gray-500">Welcome back!</h3>
      <div className="mt-8 grid grid-cols-4 gap-6">
        <div className="rounded-xl bg-white p-5 shadow-md">
          <p className="text-sm text-gray-500">Revenue</p>
          <p className="text-3xl font-semibold text-[#111827]">$48,210</p>
        </div>
      </div>
      <div className="mt-8 flex gap-3">
        <button className="rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 px-5 py-2.5 text-white">New invoice</button>
        <Button variant="primary">Export</Button>
        <Button variant="primary">Share</Button>
      </div>
      <input className="mt-4 rounded-lg border border-gray-300 p-[11px]" placeholder="Search" />
      <img src="/chart.png" />
      <div style={{ padding: 18, color: "#333" }}>Footer</div>
    </div>
  );
}
