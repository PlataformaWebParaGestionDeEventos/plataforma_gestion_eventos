import React from "react";
import appFirebase from "../credenciales";
import { getAuth, signOut } from "firebase/auth";
const auth = getAuth(appFirebase);  

const HomeOrganizador = ({ correoUsuario }) => {
    return (
        <div>
            <h2>Bienvenido Organizador {correoUsuario}
                <button className="btn btn-danger" onClick={() => signOut(auth)}>
                    Cerrar Sesion
                </button>
            </h2>
        </div>
    )
}

export default HomeOrganizador;
