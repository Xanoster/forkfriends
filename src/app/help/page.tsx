'use client';

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import Link from "next/link";

const faqs = [
    {
        question: "How do I create a new dinner?",
        answer: "Simply click the 'Create Dinner' button in the header. You'll be taken to a form where you can fill in all the details like the restaurant, date, time, and the maximum number of guests you'd like to host."
    },
    {
        question: "How do I join (book) a dinner?",
        answer: "On the homepage, browse the list of upcoming dinners. When you find one you'd like to join, click the 'Book a Slot' button on the dinner card. If there are available slots, you'll be confirmed immediately!"
    },
    {
        question: "How do reviews work?",
        answer: "After a dinner's date has passed, you'll be able to leave a review for the host and any other attendees. Go to 'My Dinners', find the past event, and click 'Leave a Review'. This helps build a trustworthy community."
    },
    {
        question: "Can I edit a dinner I've created?",
        answer: "Yes. As a host, you can edit the details of a dinner you've created. Find your dinner on the homepage or in the 'My Dinners' section and look for the edit option. You cannot, however, reduce the maximum number of guests to be lower than the number of people who have already booked."
    },
    {
        question: "Is my profile information public?",
        answer: "Other users can see your public profile, which includes your name, username, bio, and your activity stats (dinners hosted/attended, people met). Your email address is kept private."
    },
    {
        question: "How is the 'People Met' statistic calculated?",
        answer: "This stat counts every unique person you have shared a dinner with, whether you were the host or a guest. Even if you've had dinner with the same person multiple times, they are only counted once towards this total."
    }
]

export default function HelpPage() {
    const router = useRouter();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Button variant="outline" onClick={() => router.back()} className='mb-6'>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
        </Button>
        <Card>
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/20 text-primary rounded-lg">
                        <LifeBuoy className="h-8 w-8" />
                    </div>
                    <div>
                        <CardTitle className="font-headline text-3xl">Help & Support</CardTitle>
                        <CardDescription>
                            Find answers to common questions about ForkFriends.
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {faqs.map((faq, index) => (
                         <AccordionItem value={`item-${index}`} key={index}>
                            <AccordionTrigger className="text-left font-bold">{faq.question}</AccordionTrigger>
                            <AccordionContent className="text-muted-foreground">
                                {faq.answer}
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}