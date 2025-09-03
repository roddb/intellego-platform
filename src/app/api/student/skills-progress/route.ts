import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/auth-options';
import { getStudentSkillsProgress, getStudentOverallSkills } from '@/lib/db-operations';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const subject = searchParams.get('subject');
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }
    
    // If student, verify they can only access their own data
    if (session.user.role === 'STUDENT' && session.user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Get skills progress
    if (subject) {
      // Get progress for specific subject
      const progress = await getStudentSkillsProgress(userId, subject);
      
      if (progress.length === 0) {
        // Return default values if no progress yet
        return NextResponse.json({
          skills: {
            comprehension: 0,
            criticalThinking: 0,
            selfRegulation: 0,
            practicalApplication: 0,
            metacognition: 0
          },
          totalFeedbacks: 0,
          subject
        });
      }
      
      const data = progress[0] as any;
      return NextResponse.json({
        skills: {
          comprehension: data.comprehension || 0,
          criticalThinking: data.criticalThinking || 0,
          selfRegulation: data.selfRegulation || 0,
          practicalApplication: data.practicalApplication || 0,
          metacognition: data.metacognition || 0
        },
        totalFeedbacks: data.totalFeedbacks || 0,
        subject
      });
    } else {
      // Get overall skills across all subjects
      const overall = await getStudentOverallSkills(userId);
      
      if (!overall) {
        // Return default values if no progress yet
        return NextResponse.json({
          skills: {
            comprehension: 0,
            criticalThinking: 0,
            selfRegulation: 0,
            practicalApplication: 0,
            metacognition: 0
          },
          totalFeedbacks: 0,
          overall: true
        });
      }
      
      // Also get per-subject breakdown
      const bySubject = await getStudentSkillsProgress(userId);
      
      const subjectProgress = bySubject.map((row: any) => ({
        subject: row.subject,
        skills: {
          comprehension: row.comprehension || 0,
          criticalThinking: row.criticalThinking || 0,
          selfRegulation: row.selfRegulation || 0,
          practicalApplication: row.practicalApplication || 0,
          metacognition: row.metacognition || 0
        },
        totalFeedbacks: row.totalFeedbacks || 0
      }));
      
      return NextResponse.json({
        overall: {
          skills: overall,
          totalFeedbacks: overall.totalFeedbacks
        },
        bySubject: subjectProgress
      });
    }
    
  } catch (error) {
    console.error('Error fetching skills progress:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}