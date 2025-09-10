import { TrendingUp, Mail, Phone, MapPin, Github, Linkedin, Twitter } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-blue-900 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-8 w-8 text-white-300" />
              <div className="text-2xl font-bold bg-white bg-clip-text text-transparent">
                MoneyTrack
              </div>
            </div>
            <p className="text-white text-sm leading-relaxed">
              Your trusted partner in portfolio management. Track, analyze, and grow your investments with confidence.
            </p>
            {/* <div className="flex space-x-4">
              <a href="#" className="text-blue-300 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-300 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-blue-300 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div> */}
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Quick Links</h3>
            <div className="space-y-2">
              <a href="#" className="block text-violet-200 hover:text-white transition-colors text-sm">
                Dashboard
              </a>
              <a href="#" className="block text-violet-200 hover:text-white transition-colors text-sm">
                Portfolio
              </a>
              <a href="#" className="block text-violet-200 hover:text-white transition-colors text-sm">
                Watchlist
              </a>
              {/* <a href="#" className="block text-violet-200 hover:text-white transition-colors text-sm">
                Market Analysis
              </a> */}
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Contact</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-violet-200 text-sm">
                <Mail className="h-4 w-4 text-blue-300" />
                support@moneytrack.com
              </div>
              {/* <div className="flex items-center gap-3 text-violet-200 text-sm">
                <Phone className="h-4 w-4 text-blue-300" />
                +1 (555) 123-4567
              </div>
              <div className="flex items-center gap-3 text-violet-200 text-sm">
                <MapPin className="h-4 w-4 text-blue-300" />
                New York, NY 10001
              </div> */}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        {/* <div className="border-t border-violet-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-blue-300 text-sm">
              © 2024 MoneyTrack. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-blue-300 hover:text-white transition-colors text-sm">
                Security
              </a>
              <a href="#" className="text-blue-300 hover:text-white transition-colors text-sm">
                Cookies
              </a>
              <a href="#" className="text-blue-300 hover:text-white transition-colors text-sm">
                Accessibility
              </a>
            </div>
          </div>
        </div> */}
      </div>
    </footer>
  );
}
