"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function AdminClients() {

const [clients,setClients] = useState<any[]>([])

async function loadClients(){

const { data,error } = await supabase
.from("clients")
.select("*")
.order("date_inscription",{ascending:false})

if(!error){
setClients(data)
}

}

useEffect(()=>{
loadClients()
},[])

return(

<div className="p-10">

<h1 className="text-4xl font-bold mb-10">
Clients inscrits
</h1>

{clients.length === 0 && (

<div className="bg-white shadow p-6 rounded-xl">
Aucun client pour le moment
</div>

)}

{clients.map((client)=>(
<div key={client.id} className="bg-white shadow p-6 rounded-xl mb-4">

<p><b>Nom :</b> {client.nom}</p>

<p><b>Email :</b> {client.email}</p>

<p><b>Téléphone :</b> {client.telephone}</p>

<p><b>Abonnement :</b> {client.abonnement}</p>

<p><b>Statut :</b> {client.statut}</p>

<p><b>Date :</b> {client.date_inscription}</p>

</div>
))}

</div>

)

}