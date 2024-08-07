const messages = {
	en: {
		translations: {
				signup: {
					title: "Sign Up",
					toasts: {
						success: "User created successfully! Please log in.",
						fail: "Error creating user. Check the provided data."
					},
					form: {
						name: "Name",
						email: "Email",
						password: "Password"
					},
					buttons: {
						submit: "Sign Up",
						login: "Already have an account? Log in!"
					}
				},
				login: {
					title: "Login",
					form: {
						email: "Email",
						password: "Password"
					},
					buttons: {
						submit: "Log In",
						register: "Don't have an account? Sign Up!"
					}
				},
				plans: {
					form: {
						name: "Name",
						users: "Users",
						connections: "Connections",
						campaigns: "Campaigns",
						schedules: "Schedules",
						enabled: "Enabled",
						disabled: "Disabled",
						clear: "Clear",
						delete: "Delete",
						save: "Save",
						yes: "Yes",
						no: "No",
						money: "R$"
					}
				},
				companies: {
					title: "Register Company",
					form: {
						name: "Company Name",
						plan: "Plan",
						token: "Token",
						submit: "Register",
						success: "Company created successfully!"
					}
				},
				auth: {
					toasts: {
						success: "Login successful!"
					},
					token: "Token"
				},
				dashboard: {
					charts: {
						perDay: {
							title: "Today's Interactions: "
						}
					}
				},
				connections: {
					title: "Connections",
					toasts: {
						deleted: "WhatsApp connection successfully deleted!"
					},
					confirmationModal: {
						deleteTitle: "Delete",
						deleteMessage: "Are you sure? This action cannot be undone.",
						disconnectTitle: "Disconnect",
						disconnectMessage: "Are you sure? You will need to scan the QR Code again."
					},
					buttons: {
						add: "Add WhatsApp",
						disconnect: "Disconnect",
						tryAgain: "Try Again",
						qrcode: "QR CODE",
						newQr: "New QR CODE",
						connecting: "Connecting"
					},
					toolTips: {
						disconnected: {
							title: "Failed to start WhatsApp session",
							content: "Ensure your phone is connected to the internet and try again, or request a new QR Code."
						},
						qrcode: {
							title: "Waiting for QR Code scan",
							content: "Click the 'QR CODE' button and scan the QR Code with your phone to start the session."
						},
						connected: {
							title: "Connection established!"
						},
						timeout: {
							title: "Connection to the phone lost",
							content: "Ensure your phone is connected to the internet and WhatsApp is open, or click the 'Disconnect' button to get a new QR Code."
						}
					},
					table: {
						name: "Name",
						status: "Status",
						lastUpdate: "Last Update",
						default: "Default",
						actions: "Actions",
						session: "Session"
					}
				},
				whatsappModal: {
					title: {
						add: "Add WhatsApp",
						edit: "Edit WhatsApp"
					},
					form: {
						name: "Name",
						default: "Default",
						sendIdQueue: "Queue",
						timeSendQueue: "Redirect to queue in X minutes",
						queueRedirection: "Queue Redirection",
						queueRedirectionDesc: "Select a queue for contacts without a queue to be redirected",
						flow: "Flow",
						prompt: "Prompt",
						maxUseBotQueues: "Send bot X times",
						timeUseBotQueues: "Interval in minutes between bot sends",
						expiresTicket: "Close open chats after X minutes",
						expiresInactiveMessage: "Inactive closing message",
						selectFlow: "Select Flow",
					},
					buttons: {
						okAdd: "Add",
						okEdit: "Save",
						cancel: "Cancel"
					},
					success: "WhatsApp saved successfully."
				},
				qrCode: {
					message: "Scan the QR Code to start the session"
				},
				contacts: {
					title: "Contacts",
					toasts: {
						deleted: "Contact successfully deleted!"
					},
					searchPlaceholder: "Search...",
					confirmationModal: {
						deleteTitle: "Delete ",
						importTitlte: "Import Contacts",
						deleteMessage: "Are you sure you want to delete this contact? All related interactions will be lost.",
						importMessage: "Do you want to import all contacts from the phone?"
					},
					buttons: {
						import: "Import Contacts",
						importcsv: "Import Contacts by files",
						export: "Export Contacts",
						add: "Add Contact"
					},
					table: {
						name: "Name",
						whatsapp: "WhatsApp",
						email: "Email",
						actions: "Actions"
					}
				},
				queueIntegrationModal: {
						title: {
							add: "Add project",
							edit: "Edit project"
						},
						form: {
							id: "ID",
							type: "Type",
							name: "Name",
							numberDay: "number of days",
							projectName: "Project Name",
							language: "Language",
							jsonContent: "JsonContent",
							urlN8N: "URL",
							typebotSlug: "Typebot - Slug",
							typebotExpires: "Time in minutes to expire a conversation",
							typebotKeywordFinish: "Keyword to finish the ticket",
							typebotKeywordRestart: "Keyword to restart the flow",
							typebotRestartMessage: "Message when restarting the conversation",
							typebotUnknownMessage: "Invalid option message",
							typebotDelayMessage: "Interval (ms) between messages"
						},
						buttons: {
							okAdd: "Add",
							okEdit: "Save",
							cancel: "Cancel",
							test: "Test Bot"
						},
						messages: {
							testSuccess: "Integration successfully tested!",
							addSuccess: "Integration added successfully.",
							editSuccess: "Integration edited successfully."
						}
				},
				promptModal: {
					form: {
						name: "Name",
						prompt: "Prompt",
						voice: "Voice",
						max_tokens: "Maximum Tokens in Response",
						temperature: "Temperature",
						apikey: "API Key",
						max_messages: "Maximum messages in history",
						voiceKey: "Voice API Key",
						voiceRegion: "Voice Region"
					},
					success: "Prompt saved successfully!",
					title: {
						add: "Add Prompt",
						edit: "Edit Prompt"
					},
					buttons: {
						okAdd: "Add",
						okEdit: "Save",
						cancel: "Cancel"
					}
				},
				prompts: {
					title: "Prompts",
					table: {
						name: "Name",
						queue: "Department/Queue",
						max_tokens: "Maximum Tokens Response",
						actions: "Actions"
					},
					confirmationModal: {
						deleteTitle: "Delete",
						deleteMessage: "Are you sure? This action cannot be undone!"
					},
					buttons: {
						add: "Add Prompt"
					}
				},
				contactModal: {
					title: {
						add: "Add contact",
						edit: "Edit contact"
					},
					form: {
						mainInfo: "Contact information",
						extraInfo: "Additional Information",
						name: "Name",
						number: "WhatsApp Number",
						email: "Email",
						extraName: "Field Name",
						extraValue: "Value",
						whatsapp: "Origin Connection: "
					},
					buttons: {
						addExtraInfo: "Add information",
						okAdd: "Add",
						okEdit: "Save",
						cancel: "Cancel"
					},
					success: "Contact saved successfully."
				},
				queueModal: {
					title: {
						add: "Add queue",
						edit: "Edit queue"
					},
					form: {
						name: "Name",
						color: "Color",
						greetingMessage: "Greeting message",
						complationMessage: "Completion message",
						outOfHoursMessage: "Out of hours message",
						ratingMessage: "Rating message",
						token: "Token",
						orderQueue: "Queue order (Bot)",
						integrationId: "Integration"
					},
					buttons: {
						okAdd: "Add",
						okEdit: "Save",
						cancel: "Cancel"
					}
				},
				userModal: {
					title: {
						add: "Add user",
						edit: "Edit user"
					},
					form: {
						name: "Name",
						email: "Email",
						password: "Password",
						profile: "Profile",
						whatsapp: "Default Connection"
					},
					buttons: {
						okAdd: "Add",
						okEdit: "Save",
						cancel: "Cancel"
					},
					success: "User saved successfully."
				},
				scheduleModal: {
					title: {
						add: "New Schedule",
						edit: "Edit Schedule"
					},
					form: {
						body: "Message",
						contact: "Contact",
						sendAt: "Scheduling Date",
						sentAt: "Sent Date"
					},
					buttons: {
						okAdd: "Add",
						okEdit: "Save",
						cancel: "Cancel"
					},
					success: "Schedule saved successfully."
				},
				tagModal: {
					title: {
						add: "New Tag",
						edit: "Edit Tag"
					},
					form: {
						name: "Name",
						color: "Color"
					},
					buttons: {
						okAdd: "Add",
						okEdit: "Save",
						cancel: "Cancel"
					},
					success: "Tag saved successfully."
				},
				chat: {
					noTicketMessage: "Select a ticket to start chatting."
				},
				uploads: {
					titles: {
						titleUploadMsgDragDrop: "DRAG AND DROP FILES BELOW",
						titleFileList: "File(s) List"
					}
				},
				ticketsManager: {
					buttons: {
						newTicket: "New"
					}
				},
				ticketsQueueSelect: {
					placeholder: "Queues"
				},
				tickets: {
					toasts: {
						deleted: "The ticket you were on has been deleted."
					},
					notification: {
						message: "Message from"
					},
					tabs: {
						open: { title: "Open" },
						closed: { title: "Resolved" },
						search: { title: "Search" }
					},
					search: {
						placeholder: "Search for tickets and messages"
					},
					buttons: {
						showAll: "All"
					}
				},
				transferTicketModal: {
					title: "Transfer Ticket",
					fieldLabel: "Type to search for users",
					fieldQueueLabel: "Transfer to queue",
					fieldQueuePlaceholder: "Select a queue",
					noOptions: "No user found with that name",
					buttons: {
						ok: "Transfer",
						cancel: "Cancel"
					}
				},
				ticketsList: {
					pendingHeader: "Pending",
					assignedHeader: "Assigned",
					noTicketsTitle: "Nothing here!",
					noTicketsMessage: "No tickets found with this status or search term",
					buttons: {
						accept: "Accept",
						closed: "Close",
						reopen: "Reopen"
					}
				},
				newTicketModal: {
					title: "Create Ticket",
					fieldLabel: "Type to search for contact",
					add: "Add",
					buttons: {
						ok: "Save",
						cancel: "Cancel"
					}
				},
				mainDrawer: {
					listItems: {
						dashboard: "Dashboard",
						companies: "Companies",
						connections: "Connections",
						tickets: "Tickets",
						quickMessages: "Quick Messages",
						contacts: "Contacts",
						queues: "Queues & Chatbot",
						tags: "Tags",
						integration: "Automations",
          	gerenciar: "Manage",
						administration: "Administration",
						users: "Users",
						settings: "Settings",
						helps: "Help",
						messagesAPI: "API",
						schedules: "Schedules",
						campaigns: "Campaigns",
						annoucements: "Announcements",
						chats: "Internal Chat",
						financeiro: "Financial",
						files: "Files List",
						tasks: "Tasks",
						prompts: "Open.Ai",
						queueIntegration: "Integrations"
					},
					appBar: {
						user: {
							profile: "Profile",
							logout: "Logout"
						}
					}
				},
				queueIntegration: {
					title: "Integrations",
					table: {
						id: "ID",
						type: "Type",
						name: "Name",
						projectName: "Project Name",
						language: "Language",
						lastUpdate: "Last update",
						actions: "Actions"
					},
					buttons: {
						add: "Add Project"
					},
					searchPlaceholder: "Search...",
					confirmationModal: {
						deleteTitle: "Delete",
						deleteMessage: "Are you sure? This action cannot be undone! and will be removed from linked queues and connections"
					}
				},
				files: {
					title: "Files List",
					table: {
						name: "Name",
						contacts: "Contacts",
						actions: "Action"
					},
					toasts: {
						deleted: "List deleted successfully!",
						deletedAll: "All lists deleted successfully!"
					},
					buttons: {
						add: "Add",
						deleteAll: "Delete All"
					},
					confirmationModal: {
						deleteTitle: "Delete",
						deleteAllTitle: "Delete All",
						deleteMessage: "Are you sure you want to delete this list?",
						deleteAllMessage: "Are you sure you want to delete all lists?"
					}
				},
				messagesAPI: {
					title: "API",
					textMessage: {
						number: "Number",
						body: "Message",
						token: "Registered Token"
					},
					mediaMessage: {
						number: "Number",
						body: "File Name",
						media: "File",
						token: "Registered Token"
					}
				},
				notifications: {
					noTickets: "No notifications."
				},
				quickMessages: {
					title: "Quick Responses",
					searchPlaceholder: "Search...",
					noAttachment: "No attachment",
					confirmationModal: {
						deleteTitle: "Deletion",
						deleteMessage: "This action is irreversible! Do you want to proceed?"
					},
					buttons: {
						add: "Add",
						attach: "Attach File",
						cancel: "Cancel",
						edit: "Edit"
					},
					toasts: {
						success: "Shortcut added successfully!",
						deleted: "Shortcut removed successfully!"
					},
					dialog: {
						title: "Quick Message",
						shortcode: "Shortcut",
						message: "Response",
						save: "Save",
						cancel: "Cancel",
						geral: "Allow editing",
						add: "Add",
						edit: "Edit",
						visao: "Allow viewing"
					},
					table: {
						shortcode: "Shortcut",
						message: "Message",
						actions: "Actions",
						mediaName: "File Name",
						status: "Status"
					}
				},
				messageVariablesPicker: {
					label: "Available Variables",
					vars: {
						contactFirstName: "First Name",
						contactName: "Name",
						greeting: "Greeting",
						protocolNumber: "Protocol",
						date: "Date",
						hour: "Hour"
					}
				},
				contactLists: {
					title: "Contact Lists",
					table: {
						name: "Name",
						contacts: "Contacts",
						actions: "Actions"
					},
					buttons: {
						add: "New List"
					},
					dialog: {
						name: "Name",
						company: "Company",
						okEdit: "Edit",
						okAdd: "Add",
						add: "Add",
						edit: "Edit",
						cancel: "Cancel"
					},
					confirmationModal: {
						deleteTitle: "Delete",
						deleteMessage: "This action cannot be undone."
					},
					toasts: {
						deleted: "Record deleted"
					}
				},
				contactListItems: {
					title: "Contacts",
					searchPlaceholder: "Search",
					buttons: {
						add: "New",
						lists: "Lists",
						import: "Import"
					},
					dialog: {
						name: "Name",
						number: "Number",
						whatsapp: "Whatsapp",
						email: "Email",
						okEdit: "Edit",
						okAdd: "Add",
						add: "Add",
						edit: "Edit",
						cancel: "Cancel"
					},
					table: {
						name: "Name",
						number: "Number",
						whatsapp: "Whatsapp",
						email: "Email",
						actions: "Actions"
					},
					confirmationModal: {
						deleteTitle: "Delete",
						deleteMessage: "This action cannot be undone.",
						importMessage: "Do you want to import the contacts from this spreadsheet?",
						importTitlte: "Import"
					},
					toasts: {
						deleted: "Record deleted"
					}
				},
				campaigns: {
					title: "Campaigns",
					searchPlaceholder: "Search",
					buttons: {
						add: "New Campaign",
						contactLists: "Contact Lists"
					},
					table: {
						name: "Name",
						whatsapp: "Connection",
						contactList: "Contact List",
						status: "Status",
						scheduledAt: "Scheduled At",
						completedAt: "Completed At",
						confirmation: "Confirmation",
						actions: "Actions"
					},
					dialog: {
						new: "New Campaign",
						update: "Edit Campaign",
						readonly: "View Only",
						form: {
							name: "Name",
							message1: "Message 1",
							message2: "Message 2",
							message3: "Message 3",
							message4: "Message 4",
							message5: "Message 5",
							confirmationMessage1: "Confirmation Message 1",
							confirmationMessage2: "Confirmation Message 2",
							confirmationMessage3: "Confirmation Message 3",
							confirmationMessage4: "Confirmation Message 4",
							confirmationMessage5: "Confirmation Message 5",
							messagePlaceholder: "Message content",
							whatsapp: "Connection",
							status: "Status",
							scheduledAt: "Scheduled At",
							confirmation: "Confirmation",
							contactList: "Contact List",
							tagList: "Tag List",
							fileList: "File List"
						},
						buttons: {
							add: "Add",
							edit: "Update",
							okadd: "Ok",
							cancel: "Cancel Shots",
							restart: "Restart Shots",
							close: "Close",
							attach: "Attach File"
						}
					},
					confirmationModal: {
						deleteTitle: "Delete",
						deleteMessage: "This action cannot be undone."
					},
					toasts: {
						success: "Operation performed successfully",
						cancel: "Campaign canceled",
						restart: "Campaign restarted",
						deleted: "Record deleted"
					}
				},
				announcements: {
					active: "Active",
					inactive: "Inactive",
					title: "Announcements",
					searchPlaceholder: "Search",
					buttons: {
						add: "New Announcement",
						contactLists: "Announcement Lists"
					},
					table: {
						priority: "Priority",
						title: "Title",
						text: "Text",
						mediaName: "File",
						status: "Status",
						actions: "Actions"
					},
					dialog: {
						edit: "Announcement Edition",
						add: "New Announcement",
						update: "Edit Announcement",
						readonly: "View Only",
						form: {
							priority: "Priority",
							title: "Title",
							text: "Text",
							mediaPath: "File",
							status: "Status"
						}
					},
					confirmationModal: {
						deleteTitle: "Delete",
						deleteMessage: "This action cannot be undone."
					}
				},
				campaignsConfig: {
					title: "Campaign Settings"
				},
				queues: {
					title: "Queues & Chatbot",
					table: {
						greeting: "Greeting Message"
					},
					confirmationModal: {
						deleteTitle: "Delete",
						deleteMessage: "Are you sure? This action cannot be undone! The attendances in this queue will still exist but will no longer be assigned to any queue."
					}
				},
				users: {
					title: "Users",
					table: {
						actions: "Actions"
					},
					buttons: {
						add: "Add User"
					},
					toasts: {
						deleted: "User successfully deleted."
					},
					confirmationModal: {
						deleteTitle: "Delete",
						deleteMessage: "All user data will be lost. The open attendances of this user will be moved to the queue."
					}
				},
				schedules: {
					title: "Schedules",
					confirmationModal: {
						deleteTitle: "Do you really want to delete this Schedule?",
						deleteMessage: "This action cannot be undone."
					},
					table: {
						contact: "Contact",
						sendAt: "Scheduling Date",
						sentAt: "Sending Date",
						actions: "Actions"
					},
					buttons: {
						add: "New Schedule"
					},
					toasts: {
						deleted: "Schedule successfully deleted."
					}
				},
				tags: {
					title: "Tags",
					confirmationModal: {
						deleteTitle: "Do you really want to delete this Tag?",
						deleteMessage: "This action cannot be undone."
					},
					table: {
						tickets: "Tagged Records",
						actions: "Actions"
					},
					buttons: {
						add: "New Tag"
					},
					toasts: {
						deleted: "Tag successfully deleted."
					}
				},
				settings: {
					title: "Settings",
					success: "Settings saved successfully.",
					settings: {
						userCreation: {
							name: "User Creation"
						}
					}
				},
				ticketOptionsMenu: {
					registerAppointment: "Contact Observations",
					appointmentsModal: {
						title: "Contact Observations"
					},
					confirmationModal: {
						title: "Delete contact ticket",
						message: "Attention! All messages related to the ticket will be lost."
					},
					buttons: {
						delete: "Delete",
						cancel: "Cancel"
					}
				},
				confirmationModal: {
					buttons: {
						confirm: "Ok",
						cancel: "Cancel"
					}
				},
				messageOptionsMenu: {
					confirmationModal: {
						title: "Delete message?",
						message: "This action cannot be undone."
					}
				},
				backendErrors: {
					ERR_NO_OTHER_WHATSAPP: "There must be at least one default WhatsApp.",
					ERR_NO_DEF_WAPP_FOUND:
						"No default WhatsApp found. Check the connections page.",
					ERR_WAPP_NOT_INITIALIZED:
						"This WhatsApp session has not been initialized. Please check the connections page.",
					ERR_WAPP_CHECK_CONTACT:
						"Unable to verify WhatsApp contact. Check connections page",
					ERR_WAPP_INVALID_CONTACT: "This is not a valid WhatsApp number.",
					ERR_WAPP_DOWNLOAD_MEDIA:
						"Unable to download media from WhatsApp. Check the connections page.",
					ERR_INVALID_CREDENTIALS:
						"Authentication error. Please try again.",
					ERR_SENDING_WAPP_MSG:
						"Error sending WhatsApp message. Check connections page.",
					ERR_DELETE_WAPP_MSG: "Unable to delete WhatsApp message.",
					ERR_OTHER_OPEN_TICKET: "There is already an open ticket for this contact.",
					ERR_SESSION_EXPIRED: "Session expired. Please log in.",
					ERR_USER_CREATION_DISABLED:
						"User creation has been disabled by the administrator.",
					ERR_NO_PERMISSION: "You do not have permission to access this resource.",
					ERR_DUPLICATED_CONTACT: "There is already a contact with this number.",
					ERR_NO_SETTING_FOUND: "No settings found with this ID.",
					ERR_NO_CONTACT_FOUND: "No contacts found with this ID.",
					ERR_NO_TICKET_FOUND: "No tickets found with this ID.",
					ERR_NO_USER_FOUND: "No user found with this ID.",
					ERR_NO_WAPP_FOUND: "No WhatsApp found with this ID.",
					ERR_CREATING_MESSAGE: "Error creating message in the database.",
					ERR_CREATING_TICKET: "Error creating ticket in database.",
					ERR_FETCH_WAPP_MSG:
						"Error when searching for the message on WhtasApp, perhaps it is too old.",
					ERR_QUEUE_COLOR_ALREADY_EXISTS:
						"This color is already in use, choose another.",
					ERR_WAPP_GREETING_REQUIRED:
						"The greeting message is mandatory when there is more than one queue.",
				},
				integrationModal: {
					title: {
						name: "Integrations",
						add: "Add Integration",
						edit: "Edit Integration",
					},
					form: {
						token: "Integration Token",
						default: "Default",
					},
					buttons: {
						okAdd: "Add",
						okEdit: "Save",
						cancel: "Cancel",
					},
					success: "Integration saved successfully.",
				},
		}
	},
	};

export { messages };
