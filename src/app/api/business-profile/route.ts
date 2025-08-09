import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/authOptions";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const businessProfile = await prisma.businessProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!businessProfile) {
      // Devolver configuración por defecto si no existe
      return NextResponse.json({
        businessProfile: {
          businessName: "",
          businessDescription: "",
          businessLogo: "",
          businessWebsite: "",
          businessPhone: "",
          businessAddress: "",
          primaryColor: "#1976D2",
          secondaryColor: "#E3F2FD",
          accentColor: "#1565C0",
          emailSignature: "",
          emailFooter: "",
          emailNotifications: true,
          smsNotifications: false,
          showBusinessInfo: true,
          allowPublicProfile: false
        }
      });
    }

    return NextResponse.json({ businessProfile });
  } catch (error) {
    console.error("Error fetching business profile:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      businessName,
      businessDescription,
      businessLogo,
      businessWebsite,
      businessPhone,
      businessAddress,
      primaryColor,
      secondaryColor,
      accentColor,
      emailSignature,
      emailFooter,
      emailNotifications,
      smsNotifications,
      showBusinessInfo,
      allowPublicProfile
    } = body;

    // Usar upsert para crear o actualizar el perfil
    const businessProfile = await prisma.businessProfile.upsert({
      where: { userId: session.user.id },
      update: {
        businessName: businessName || "",
        businessDescription: businessDescription || "",
        businessLogo: businessLogo || "",
        businessWebsite: businessWebsite || "",
        businessPhone: businessPhone || "",
        businessAddress: businessAddress || "",
        primaryColor: primaryColor || "#1976D2",
        secondaryColor: secondaryColor || "#E3F2FD",
        accentColor: accentColor || "#1565C0",
        emailSignature: emailSignature || "",
        emailFooter: emailFooter || "",
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
        showBusinessInfo: showBusinessInfo !== undefined ? showBusinessInfo : true,
        allowPublicProfile: allowPublicProfile !== undefined ? allowPublicProfile : false
      },
      create: {
        userId: session.user.id,
        businessName: businessName || "",
        businessDescription: businessDescription || "",
        businessLogo: businessLogo || "",
        businessWebsite: businessWebsite || "",
        businessPhone: businessPhone || "",
        businessAddress: businessAddress || "",
        primaryColor: primaryColor || "#1976D2",
        secondaryColor: secondaryColor || "#E3F2FD",
        accentColor: accentColor || "#1565C0",
        emailSignature: emailSignature || "",
        emailFooter: emailFooter || "",
        emailNotifications: emailNotifications !== undefined ? emailNotifications : true,
        smsNotifications: smsNotifications !== undefined ? smsNotifications : false,
        showBusinessInfo: showBusinessInfo !== undefined ? showBusinessInfo : true,
        allowPublicProfile: allowPublicProfile !== undefined ? allowPublicProfile : false
      }
    });

    return NextResponse.json({
      success: true,
      businessProfile,
      message: "Perfil de negocio guardado correctamente"
    });

  } catch (error) {
    console.error("Error saving business profile:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
} 