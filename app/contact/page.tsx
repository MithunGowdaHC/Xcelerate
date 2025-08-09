"use client"

import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Github, Twitter, Linkedin, Mail } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-16 flex-1">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto">
          <Card className="bg-background/70 backdrop-blur">
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center gap-6 text-muted-foreground">
                <a
                  href="https://github.com/MithunGowdaHC"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                  className="hover:text-foreground transition-colors"
                >
                  <Github className="h-6 w-6" />
                </a>
              
                <a
                  href="https://www.linkedin.com/in/mithungowda10/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="hover:text-foreground transition-colors"
                >
                  <Linkedin className="h-6 w-6" />
                </a>
                <a
                  href="mailto:mithungowdahc12a@gmail.com"
                  aria-label="Email"
                  className="hover:text-foreground transition-colors"
                >
                  <Mail className="h-6 w-6" />
                </a>
              </div>

              <div className="space-y-4">
                <Input placeholder="Your name" />
                <Input type="email" placeholder="Email address" />
                <Textarea placeholder="Message" className="min-h-[140px]" />
                <Button className="w-full">Send message</Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
      <Footer />
    </div>
  )
}
