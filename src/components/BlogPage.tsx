import ChatServiceDemo from '../../chat-service-demo';

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="flex w-full px-2">
        {/* Main Content */}
        <main className="flex-1 px-2 py-12 max-w-none">
          <article className="prose prose-lg max-w-none">
            {/* Article Header */}
            <div className="mb-12">
              <h1 className="text-5xl font-serif text-gray-900 leading-tight mb-4 font-light">
                Building the Future of AI-Powered Customer Support
              </h1>
              <h2 className="text-2xl font-serif text-gray-600 leading-relaxed mb-8 font-light">
                A Deep Dive into Intelligent Agent Workflows
              </h2>
              <div className="flex items-center space-x-4 text-gray-600 mb-8">
                <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                  GD
                </div>
                <div>
                  <p className="font-medium text-gray-900">Geoffrey Dudgeon</p>
                  <p className="text-sm">Dec 15, 2024 · 8 min read</p>
                </div>
              </div>
            </div>

            {/* Article Content */}
            <div className="space-y-8 text-gray-700 leading-relaxed">
              <p className="text-xl text-gray-800 font-light">
                In today's rapidly evolving digital landscape, customer support has become the cornerstone of successful businesses. 
                The integration of artificial intelligence into customer service workflows represents a paradigm shift that's reshaping 
                how companies interact with their customers.
              </p>

              <h3 className="text-3xl font-serif text-gray-900 mt-12 mb-6 font-light">The Evolution of Customer Support</h3>
              
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure 
                dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
              </p>

              <p>
                Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. 
                Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, 
                eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.
              </p>

              <blockquote className="border-l-4 border-blue-500 pl-6 py-4 bg-gray-50 rounded-r-lg my-8">
                <p className="text-lg italic text-gray-800 font-serif">
                  "The future of customer support lies not in replacing human agents, but in empowering them with intelligent tools 
                  that enhance their capabilities and improve customer experiences."
                </p>
                <cite className="text-sm text-gray-600 mt-2 block">— Industry Expert</cite>
              </blockquote>

              <h3 className="text-3xl font-serif text-gray-900 mt-12 mb-6 font-light">Interactive Demo: AI Agent Workflow</h3>
              
              <p>
                To better understand how modern AI-powered customer support systems work, we've created an interactive demonstration 
                that showcases the complete workflow from customer inquiry to resolution. The demo below illustrates the seamless 
                integration between human oversight and AI automation.
              </p>

              <p>
                Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos 
                qui ratione voluptatem sequi nesciunt. Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, 
                adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
              </p>

              <h4 className="text-2xl font-serif text-gray-900 mt-10 mb-4 font-light">Key Features of the Workflow</h4>
              
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Real-time Processing:</strong> Instant analysis and routing of customer inquiries</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Multi-tool Integration:</strong> Seamless access to databases, CRM systems, and external APIs</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Human-in-the-loop:</strong> Critical approval checkpoints for quality assurance</span>
                </li>
                <li className="flex items-start">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                  <span><strong>Visual Workflow:</strong> Complete transparency in the decision-making process</span>
                </li>
              </ul>

              <h3 className="text-3xl font-serif text-gray-900 mt-12 mb-6 font-light">The Technology Behind the Magic</h3>
              
              <p>
                At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque 
                corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa 
                qui officia deserunt mollitia animi, id est laborum et dolorum fuga.
              </p>

              <p>
                Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio 
                cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.
              </p>

              <h4 className="text-2xl font-serif text-gray-900 mt-10 mb-4 font-light">Implementation Considerations</h4>
              
              <p>
                Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae 
                sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus 
                maiores alias consequatur aut perferendis doloribus asperiores repellat.
              </p>

              <h3 className="text-3xl font-serif text-gray-900 mt-12 mb-6 font-light">Looking Ahead</h3>
              
              <p>
                The future of customer support is bright, with AI serving as a powerful ally to human agents rather than a replacement. 
                As we continue to refine these systems, we can expect even more sophisticated workflows that deliver exceptional customer 
                experiences while maintaining the human touch that customers value.
              </p>

              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
                Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>

              {/* Call to Action */}
              <div className="bg-gradient-to-r from-blue-50 to-gray-50 rounded-xl p-8 mt-12">
                <h4 className="text-2xl font-serif text-gray-900 mb-4 font-light">Ready to Transform Your Customer Support?</h4>
                <p className="text-gray-700 mb-6">
                  Discover how AI-powered workflows can revolutionize your customer service operations. 
                  Get started with our comprehensive platform today.
                </p>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                  Learn More
                </button>
              </div>
            </div>
          </article>
        </main>

        {/* Sticky Demo Card */}
        <aside className="w-3/5 pl-2 pr-2">
          <div className="sticky top-8">
            <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="min-h-[600px]">
                <ChatServiceDemo />
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
} 