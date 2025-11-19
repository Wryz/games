'use client'

import Link from 'next/link'
import BackgroundPattern from '@/components/BackgroundPattern'
import FloatingParticles from '@/components/FloatingParticles'
import GameHeader from '@/components/GameHeader'
import GameFooter from '@/components/GameFooter'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50 dark:from-neutral-900 dark:via-gray-900 dark:to-blue-900/20 relative overflow-x-hidden transition-colors duration-300">
      <BackgroundPattern />
      <FloatingParticles />
      
      <div className="relative z-10">
        <div className="p-4 sm:p-6 md:p-8">
          <GameHeader />
          
          <main className="mt-8 mb-16 max-w-4xl mx-auto">
            <div className="space-y-8">
              {/* Header */}
              <div className="text-start space-y-4">
                <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 bg-clip-text text-transparent">
                  About Brain Benchmark
                </h1>
              </div>

              {/* Mission Section */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Our Mission</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Brain Benchmark is an educational platform designed to assess and improve cognitive abilities through 
                  scientifically-validated exercises. Our assessments are based on established neuropsychological tests 
                  and cognitive training research, providing users with insights into their cognitive performance across 
                  multiple domains.
                </p>
              </section>

              {/* Research Foundation Section */}
              <section className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Research Foundation</h2>
                
                <div className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border-l-4 border-blue-500">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Working Memory Training
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                      Research has shown that working memory training can lead to improvements in cognitive performance. 
                      Studies by Klingberg et al. (2005) demonstrated that intensive working memory training can improve 
                      performance on non-trained tasks, suggesting transfer effects to other cognitive domains.
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      Reference: Klingberg, T., et al. (2005). Computerized training of working memory in children with ADHD. 
                      Journal of the American Academy of Child & Adolescent Psychiatry, 44(2), 177-186.
                    </p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-6 border-l-4 border-purple-500">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Reaction Time and Processing Speed
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                      Reaction time tasks are widely used in cognitive assessment and have been linked to general cognitive 
                      ability. Studies indicate that reaction time measures correlate with intelligence and can be improved 
                      through practice and training (Jensen, 2006).
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      Reference: Jensen, A. R. (2006). Clocking the mind: Mental chronometry and individual differences. 
                      Elsevier.
                    </p>
                  </div>

                  <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-6 border-l-4 border-cyan-500">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Stroop Test and Executive Function
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                      The Stroop Color-Word Test is one of the most widely used measures of executive function and cognitive 
                      control. It assesses the ability to inhibit automatic responses and has been used in thousands of 
                      research studies to measure attention, processing speed, and cognitive flexibility (MacLeod, 1991).
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      Reference: MacLeod, C. M. (1991). Half a century of research on the Stroop effect: an integrative review. 
                      Psychological Bulletin, 109(2), 163-203.
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 border-l-4 border-green-500">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Pattern Recognition and Visual Processing
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                      Pattern recognition tasks measure visual-spatial processing and have been linked to mathematical ability 
                      and general intelligence. Research suggests that pattern recognition training can improve visual processing 
                      skills and may transfer to other cognitive domains (Halpern et al., 2013).
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      Reference: Halpern, D. F., et al. (2013). Enhancing and assessing critical thinking skills in the 
                      classroom. In Critical thinking: A model of intelligence for solving real-world problems (pp. 1-24).
                    </p>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 border-l-4 border-orange-500">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      Spatial Navigation and Maze Tasks
                    </h3>
                    <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                      Spatial navigation tasks, such as maze solving, engage multiple cognitive systems including working 
                      memory, planning, and spatial reasoning. Research has shown that spatial training can improve 
                      performance in mathematics and science (Uttal et al., 2013).
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                      Reference: Uttal, D. H., et al. (2013). The malleability of spatial skills: a meta-analysis of 
                      training studies. Psychological Bulletin, 139(2), 352-402.
                    </p>
                  </div>
                </div>
              </section>

              {/* Educational Value Section */}
              <section className="space-y-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Educational Value</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Brain Benchmark provides students and educators with tools to:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 ml-4">
                  <li>Assess cognitive strengths and areas for improvement</li>
                  <li>Track progress over time through detailed performance metrics</li>
                  <li>Engage in evidence-based cognitive training exercises</li>
                  <li>Learn about cognitive psychology and neuroscience through interactive assessments</li>
                  <li>Develop metacognitive awareness of their own cognitive processes</li>
                </ul>
              </section>

              {/* Limitations Section */}
              <section className="space-y-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg p-6 border-l-4 border-amber-500">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Important Note</h2>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  While cognitive training exercises can provide valuable insights and may lead to improvements in specific 
                  tasks, research on the transfer of training to broader cognitive abilities is ongoing. Brain Benchmark 
                  is designed for educational and assessment purposes and should not replace professional cognitive 
                  evaluation or medical advice.
                </p>
              </section>

              {/* Back to Home */}
              <div className="pt-6">
                <Link 
                  href="/"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>
          </main>
          
          <GameFooter />
        </div>
      </div>
    </div>
  )
}

