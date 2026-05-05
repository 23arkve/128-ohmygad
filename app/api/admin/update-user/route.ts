import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateAddress, validateStudentNum, validateGsoSessions, validateAshoSessions } from "@/lib/validation";

export async function PATCH(req: Request) {
    try {
        const body = await req.json();
        const {
            id, email, password, full_name, display_name, role,
            contact_num, address, pronouns, college, program,
            student_num, year_level, sex_at_birth, gender_identity,
            gso_attended, asho_attended, forum_attended,
            research_attended, training_attended, workshop_attended,
            is_onboarded, office, department,
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: "User ID is required." },
                { status: 400 },
            );
        }

        if (role === "student") {
            if (!college) return NextResponse.json({ error: "College is required for students." }, { status: 400 });
            if (!program) return NextResponse.json({ error: "Program is required for students." }, { status: 400 });
            if (!student_num) return NextResponse.json({ error: "Student Number is required for students." }, { status: 400 });

            const studentErr = validateStudentNum(student_num);
            if (studentErr) {
                return NextResponse.json({ error: studentErr }, { status: 400 });
            }
        } else if (student_num) {
            const studentErr = validateStudentNum(student_num);
            if (studentErr) {
                return NextResponse.json({ error: studentErr }, { status: 400 });
            }
        }

        if (address !== undefined) {
            const addressErr = validateAddress(address);
            if (addressErr) {
                return NextResponse.json({ error: addressErr }, { status: 400 });
            }
        }

        if (gso_attended !== undefined) {
            const gsoErr = validateGsoSessions(gso_attended);
            if (gsoErr) {
                return NextResponse.json({ error: gsoErr }, { status: 400 });
            }
        }

        if (asho_attended !== undefined) {
            const ashoErr = validateAshoSessions(asho_attended);
            if (ashoErr) {
                return NextResponse.json({ error: ashoErr }, { status: 400 });
            }
        }

        // 1. Build auth update payload with only provided fields
        const authUpdatePayload: {
            email?: string;
            password?: string;
            user_metadata?: { full_name: string };
        } = {};

        if (email) authUpdatePayload.email = email;
        if (password) authUpdatePayload.password = password;
        if (full_name) authUpdatePayload.user_metadata = { full_name };

        if (Object.keys(authUpdatePayload).length > 0) {
            const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
                id,
                authUpdatePayload,
            );

            if (authError) {
                return NextResponse.json({ error: authError.message }, { status: 400 });
            }
        }

        // 2. Build profile update with only provided fields
        const profileUpdatePayload: Record<string, unknown> = {};

        if (full_name !== undefined) profileUpdatePayload.full_name = full_name;
        if (display_name !== undefined) profileUpdatePayload.display_name = display_name || null;
        if (role !== undefined) profileUpdatePayload.role = role;
        if (contact_num !== undefined) profileUpdatePayload.contact_num = contact_num || null;
        if (address !== undefined) profileUpdatePayload.address = address || null;
        if (pronouns !== undefined) profileUpdatePayload.pronouns = pronouns || null;
        if (college !== undefined) profileUpdatePayload.college = college || null;
        if (program !== undefined) profileUpdatePayload.program = program || null;
        if (student_num !== undefined) profileUpdatePayload.student_num = student_num ? Number(student_num) : null;
        if (year_level !== undefined) profileUpdatePayload.year_level = year_level || null;
        if (sex_at_birth !== undefined) profileUpdatePayload.sex_at_birth = sex_at_birth || null;
        if (gender_identity !== undefined) profileUpdatePayload.gender_identity = gender_identity || null;
        if (gso_attended !== undefined) profileUpdatePayload.gso_attended = gso_attended ? Number(gso_attended) : 0;
        if (asho_attended !== undefined) profileUpdatePayload.asho_attended = asho_attended ? Number(asho_attended) : 0;
        if (forum_attended !== undefined) profileUpdatePayload.forum_attended = forum_attended ? Number(forum_attended) : 0;
        if (research_attended !== undefined) profileUpdatePayload.research_attended = research_attended ? Number(research_attended) : 0;
        if (training_attended !== undefined) profileUpdatePayload.training_attended = training_attended ? Number(training_attended) : 0;
        if (workshop_attended !== undefined) profileUpdatePayload.workshop_attended = workshop_attended ? Number(workshop_attended) : 0;
        if (is_onboarded !== undefined) profileUpdatePayload.is_onboarded = is_onboarded;
        if (office !== undefined) profileUpdatePayload.office = office || null;
        if (department !== undefined) profileUpdatePayload.department = department || null;

        if (Object.keys(profileUpdatePayload).length > 0) {
            const { error: profileError } = await supabaseAdmin
                .from("profile")
                .update(profileUpdatePayload)
                .eq("id", id);

            if (profileError) {
                return NextResponse.json({ error: profileError.message }, { status: 500 });
            }
        }

        return NextResponse.json({ id }, { status: 200 });
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "An unexpected error occurred." },
            { status: 500 },
        );
    }
}