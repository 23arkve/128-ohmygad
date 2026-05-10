import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validateFullName, validateEmail, validatePassword, validateContactNum, validateStudentNum, validateAddress, validateGsoSessions, validateAshoSessions } from "@/lib/validation";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const {
            email, password, full_name, display_name, role,
            contact_num, address, pronouns, college, program,
            student_num, year_level, sex_at_birth, gender_identity,
            gso_attended, asho_attended, forum_attended,
            research_attended, training_attended, workshop_attended,
            is_onboarded, office, department,
        } = body;

        if (!email || !password || !full_name || !role) {
            return NextResponse.json(
                { error: "Email, password, full name, and role are required." },
                { status: 400 },
            );
        }

        const emailErr = validateEmail(email);
        if (emailErr) {
            return NextResponse.json({ error: emailErr }, { status: 400 });
        }

        const pwErr = validatePassword(password);
        if (pwErr) {
            return NextResponse.json({ error: pwErr }, { status: 400 });
        }

        const nameErr = validateFullName(full_name);
        if (nameErr) {
            return NextResponse.json({ error: nameErr }, { status: 400 });
        }

        const contactErr = validateContactNum(contact_num);
        if (contactErr) {
            return NextResponse.json({ error: contactErr }, { status: 400 });
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
            // Optional student_num validation for non-student roles if provided
            const studentErr = validateStudentNum(student_num);
            if (studentErr) {
                return NextResponse.json({ error: studentErr }, { status: 400 });
            }
        }

        const addressErr = validateAddress(address);
        if (addressErr) {
            return NextResponse.json({ error: addressErr }, { status: 400 });
        }

        const gsoErr = validateGsoSessions(gso_attended);
        if (gsoErr) {
            return NextResponse.json({ error: gsoErr }, { status: 400 });
        }

        const ashoErr = validateAshoSessions(asho_attended);
        if (ashoErr) {
            return NextResponse.json({ error: ashoErr }, { status: 400 });
        }

        // 1. Create the auth user with email auto-confirmed
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { full_name },
        });

        if (authError) {
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        const userId = authData.user.id;

        // 2. Update the profile row with all provided fields
        const { error: profileError } = await supabaseAdmin
            .from("profile")
            .update({
                email,
                full_name,
                display_name: display_name || null,
                role,
                contact_num: contact_num || null,
                address: address || null,
                pronouns: pronouns || null,
                college: college || null,
                program: program || null,
                student_num: student_num ? Number(student_num) : null,
                year_level: year_level || null,
                sex_at_birth: sex_at_birth || null,
                gender_identity: gender_identity || null,
                gso_attended: gso_attended ? Number(gso_attended) : 0,
                asho_attended: asho_attended ? Number(asho_attended) : 0,
                forum_attended: forum_attended ? Number(forum_attended) : 0,
                research_attended: research_attended ? Number(research_attended) : 0,
                training_attended: training_attended ? Number(training_attended) : 0,
                workshop_attended: workshop_attended ? Number(workshop_attended) : 0,
                is_onboarded: is_onboarded ?? true,
                office: office || null,
                department: department || null,
            })
            .eq("id", userId);

        if (profileError) {
            return NextResponse.json({ error: profileError.message }, { status: 500 });
        }

        return NextResponse.json({ id: userId }, { status: 201 });
    } catch (err: unknown) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "An unexpected error occurred." },
            { status: 500 },
        );
    }
}
