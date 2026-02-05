"use client";

import Link from "next/link";
import { Mail, Phone, Instagram, Youtube, Facebook } from "lucide-react";
import { motion } from "framer-motion";

const footerLinks = {
  service: [
    { label: "이용약관", href: "/terms" },
    { label: "개인정보처리방침", href: "/privacy" },
    { label: "FAQ", href: "/faq" },
    { label: "고객센터", href: "/contact" },
  ],
  social: [
    { label: "Instagram", href: "#", icon: Instagram },
    { label: "YouTube", href: "#", icon: Youtube },
    { label: "Facebook", href: "#", icon: Facebook },
  ],
};

const companyInfo = {
  name: "오늘의마사지",
  businessNumber: "123-45-67890",
  ceo: "홍길동",
  address: "서울특별시 강남구 테헤란로 123",
  email: "support@todaymassage.co.kr",
  phone: "1588-0000",
};

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-screen-sm mx-auto px-4 py-8">
        {/* 링크 섹션 */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* 서비스 링크 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              서비스
            </h3>
            <ul className="space-y-2">
              {footerLinks.service.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-600 hover:text-primary transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 고객지원 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              고객지원
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href={`mailto:${companyInfo.email}`}
                  className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Mail className="h-3.5 w-3.5" />
                  <span className="truncate">{companyInfo.email}</span>
                </a>
              </li>
              <li>
                <a
                  href={`tel:${companyInfo.phone}`}
                  className="text-sm text-gray-600 hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {companyInfo.phone}
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* SNS 링크 */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-200">
          {footerLinks.social.map((social) => {
            const Icon = social.icon;
            return (
              <motion.a
                key={social.label}
                href={social.href}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-gray-200 text-gray-600 hover:bg-primary hover:text-white transition-all"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                aria-label={social.label}
              >
                <Icon className="h-4 w-4" />
              </motion.a>
            );
          })}
        </div>

        {/* 회사 정보 */}
        <div className="space-y-2 mb-4">
          <p className="text-sm font-semibold text-gray-900">
            {companyInfo.name}
          </p>
          <div className="text-xs text-gray-600 space-y-1">
            <p>대표: {companyInfo.ceo}</p>
            <p>사업자등록번호: {companyInfo.businessNumber}</p>
            <p className="break-words">{companyInfo.address}</p>
          </div>
        </div>

        {/* 저작권 */}
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            © {new Date().getFullYear()} {companyInfo.name}. All rights
            reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
