export default function Footer() {
  return (
    <footer className="border-t border-gray-400 bg-gray-50">
      <div className="container mx-auto px-4 py-12 ">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-[#2a4e89] transition-colors">
                  Features
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">About Us</h3>
            <ul className="space-y-2 text-sm ">
              <li>
                <a href="#" className="hover:text-[#4b7ac6] transition-colors">
                  SuiAudit Lab
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className=" pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-500">
            © {new Date().getFullYear()} SuiAudit Lab. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
