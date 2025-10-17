/// SuiGuard Security Certificate System
/// Issues and manages security certificates for audited packages
module suiguard_certificate::certificate {
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};
    use std::string::{Self, String};
    use sui::clock::{Self, Clock};
    use sui::event;

    /// Error codes
    const ENotExpired: u64 = 1;
    const EUnauthorized: u64 = 2;

    /// Admin capability for managing certificates
    public struct AdminCap has key, store {
        id: UID,
    }

    /// Security Certificate NFT for audited Sui packages
    public struct SecurityCertificate has key, store {
        id: UID,
        recipient: address,          // User's wallet address
        package_id: String,          // Audited fupackage ID
        risk_level: String,          // LOW, MEDIUM, HIGH
        security_score: u8,          // 0-100 security score
        certification_date: u64,     // Issue timestamp (milliseconds)
        expiry_date: u64,            // Expiry timestamp (30 days from issue)
        recommendation: String,      // Security recommendation
        analyzer_version: String,    // Backend analyzer version
    }

    /// Certificate issued event
    public struct CertificateIssued has copy, drop {
        certificate_id: object::ID,
        recipient: address,
        package_id: String,
        security_score: u8,
        risk_level: String,
    }

    /// Certificate revoked event
    public struct CertificateRevoked has copy, drop {
        certificate_id: object::ID,
        recipient: address,
        package_id: String,
        revoke_reason: String,  // "expired" or "manual"
    }

    /// Initialize the module - creates admin capability
    fun init(ctx: &mut TxContext) {
        transfer::transfer(AdminCap {
            id: object::new(ctx),
        }, tx_context::sender(ctx));
    }

    /// Issue a new security certificate for an audited package
    /// User pays gas fee to mint their certificate
    public entry fun issue_certificate(
        recipient: address,
        package_id: vector<u8>,
        risk_level: vector<u8>,
        security_score: u8,
        recommendation: vector<u8>,
        analyzer_version: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let current_time = clock::timestamp_ms(clock);
        let expiry_time = current_time + (30 * 24 * 60 * 60 * 1000); // 30 days validity
        
        let certificate = SecurityCertificate {
            id: object::new(ctx),
            recipient,
            package_id: string::utf8(package_id),
            risk_level: string::utf8(risk_level),
            security_score,
            certification_date: current_time,
            expiry_date: expiry_time,
            recommendation: string::utf8(recommendation),
            analyzer_version: string::utf8(analyzer_version),
        };

        // Emit certificate issued event
        event::emit(CertificateIssued {
            certificate_id: object::id(&certificate),
            recipient,
            package_id: string::utf8(package_id),
            security_score,
            risk_level: string::utf8(risk_level),
        });

        transfer::public_transfer(certificate, recipient);
    }

    /// Get certificate details
    public fun get_certificate_info(cert: &SecurityCertificate): (String, String, u8, u64, u64) {
        (
            cert.package_id,
            cert.risk_level,
            cert.security_score,
            cert.certification_date,
            cert.expiry_date
        )
    }

    /// Check if certificate is still valid
    public fun is_valid(cert: &SecurityCertificate, clock: &Clock): bool {
        clock::timestamp_ms(clock) < cert.expiry_date
    }

    /// Revoke certificate (burn it) - user can revoke their own certificate
    public entry fun revoke_certificate(cert: SecurityCertificate) {
        let SecurityCertificate { id, recipient, package_id, .. } = cert;
        
        event::emit(CertificateRevoked {
            certificate_id: object::uid_to_inner(&id),
            recipient,
            package_id,
            revoke_reason: string::utf8(b"manual"),
        });
        
        object::delete(id);
    }

    /// Admin burns expired certificate
    public entry fun burn_expired_certificate(
        _admin: &AdminCap,
        cert: SecurityCertificate,
        clock: &Clock,
    ) {
        // Verify certificate is expired
        assert!(!is_valid(&cert, clock), ENotExpired);
        
        let SecurityCertificate { id, recipient, package_id, .. } = cert;
        
        event::emit(CertificateRevoked {
            certificate_id: object::uid_to_inner(&id),
            recipient,
            package_id,
            revoke_reason: string::utf8(b"expired"),
        });
        
        object::delete(id);
    }
}
